from dotenv import load_dotenv
from pydantic import BaseModel
import json

from slack_sdk.web import WebClient
import os
import re
import nltk
import asyncio

from src.loader import url_loader
from src.chains import BedrockChainService


class SlackEventFromMessageChannel(BaseModel):
    user: str
    type: str
    ts: str
    text: str
    channel: str
    event_ts: str


class SlackEventFromMessageChannelVersion2(BaseModel):
    token: str
    team_id: str
    api_app_id: str
    type: str
    event: SlackEventFromMessageChannel


class SlackEventFromMessage(BaseModel):
    user: str
    type: str
    ts: str
    text: str


async def _handler(event, context):
    load_dotenv()
    nltk.data.path.append("/var/task/nltk_data")
    print("======== event ========")
    print(event)
    print("======== event end ========")
    if "type" not in event.keys():
        print("event not found")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "x-Slack-No-Retry": 1},
            "body": json.dumps({"message": "event not found"}),
        }

    # for handshake
    if event["type"] == "url_verification":
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"challenge": event["challenge"]}),
        }

    print("======== start summarize ========")

    client = WebClient(os.getenv("SLACK_API_TOKEN"))
    slack_request_content = event["event"]
    if "text" in slack_request_content.keys():
        message = slack_request_content["text"]
    elif "message" in slack_request_content.keys():
        message = slack_request_content["message"]["text"]
    else:
        print("message not found")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "x-Slack-No-Retry": 1},
            "body": json.dumps({"message": "message not found"}),
        }
    print("message: ", message)

    def get_url_from_message(urls):
        regex = r"<(https?://[^\s>]+)>"
        url = re.findall(regex, urls)
        return url[0] if len(url) > 0 else None

    from_url = get_url_from_message(message)
    if from_url == None:
        print("url not found")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "x-Slack-No-Retry": 1},
            "body": json.dumps({"urls": "url not found"}),
        }

    documents = await url_loader(from_url)
    if documents == []:
        print("document not found")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "x-Slack-No-Retry": 1},
            "body": json.dumps({"message": "document not found"}),
        }
    service = BedrockChainService()
    llm_response = service.run(
        "次の文章を日本語で要約して。次のフォーマットを守って出力してね\n\n1.読むべき人:\n2.キーワード:\n3.要約\n\n対象の文章:"
        + documents[0].page_content
    )
    client.chat_postMessage(
        channel=slack_request_content["channel"] or os.environ["SLACK_CHANNEL_ID"],
        text=llm_response,
        thread_ts=slack_request_content["ts"],
    )

    print("======== end summarize ========")
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"message": "hello world"}),
    }


def handler(event, context):
    return asyncio.get_event_loop().run_until_complete(_handler(event, context))
