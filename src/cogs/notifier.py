import os

import discord
from discord import app_commands
from discord.ext import commands

from src.utils.webhook import send_webhook


class Notifier(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.webhook_url = os.getenv("WEBHOOK_URL")
        self.target_channel_id = os.getenv("TARGET_CHANNEL_ID")

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        # 受信した全メッセージをログ出力 (デバッグ用)
        print(
            f"[Debug] Received: '{message.content[:30]}' "
            f"in {message.channel.id} by {message.author}"
        )

        # Bot 自身のメッセージは無視
        if message.author.bot:
            return

        # ターゲットチャンネルが設定されているか確認
        if not self.target_channel_id:
            print("[Debug] TARGET_CHANNEL_ID is not set.")
            return

        # 判定
        current_id = str(message.channel.id)
        target_id = str(self.target_channel_id).strip()

        if current_id != target_id:
            return

        print("[Notifier] Target match! Sending to Webhook...")

        # Webhook 送信
        channel_name = (
            getattr(message.channel, "name", "Unknown Channel")
            if not isinstance(message.channel, discord.PartialMessageable)
            else "Partial Channel"
        )
        content = (
            f"Message received in {channel_name} "
            f"from {message.author}:\n{message.content}"
        )
        await send_webhook(str(self.webhook_url), content)

    @app_commands.command(
        name="notify", description="Send a manual notification via Webhook"
    )
    @app_commands.describe(text="The text to send")
    async def notify(self, interaction: discord.Interaction, text: str):
        """手動で Webhook を送信するスラッシュコマンド"""
        await interaction.response.defer(ephemeral=True)

        success = await send_webhook(str(self.webhook_url), text)

        if success:
            await interaction.followup.send(
                "Webhook sent successfully!", ephemeral=True
            )
        else:
            await interaction.followup.send(
                "Failed to send Webhook. Check logs.", ephemeral=True
            )


async def setup(bot: commands.Bot):
    await bot.add_cog(Notifier(bot))
