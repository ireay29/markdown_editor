import logging

import httpx

logger = logging.getLogger(__name__)


async def send_webhook(url: str, content: str, payload: dict | None = None) -> bool:
    """
    指定した URL に Webhook (POST) を送信します。

    Args:
        url: 送信先の URL
        content: メッセージ本文
        payload: 追加の JSON データ (任意)

    Returns:
        送信成功した場合は True, 失敗した場合は False
    """
    if not url:
        logger.error("Webhook URL is not set.")
        return False

    data = payload or {}
    data["content"] = content

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, timeout=10.0)
            response.raise_for_status()
            logger.info(f"Webhook sent successfully to {url}")
            return True
    except httpx.HTTPStatusError as e:
        logger.error(
            f"HTTP error occurred: {e.response.status_code} - {e.response.text}"
        )
    except Exception as e:
        logger.error(f"An unexpected error occurred during Webhook sending: {e}")

    return False
