import asyncio
import os

import discord
from discord.ext import commands
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()
TOKEN = os.getenv("DISCORD_BOT_TOKEN")

# Bot の設定 (Intents)
intents = discord.Intents.default()
intents.message_content = True


class DiscordBot(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix="!", intents=intents, help_command=None)

    async def setup_hook(self):
        # Notifier Cog をロード
        await self.load_extension("src.cogs.notifier")
        print("Loaded extension: src.cogs.notifier")

        # スラッシュコマンドの同期
        guild_id = os.getenv("GUILD_ID")
        if guild_id:
            guild = discord.Object(id=int(guild_id))
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
            print(f"Synced slash commands to guild: {guild_id}")
        else:
            await self.tree.sync()
            print("Synced slash commands globally")

    async def on_ready(self):
        if self.user:
            print(f"Logged in as {self.user} (ID: {self.user.id})")
            print("Visible Channels:")
            # Bot が見えているすべてのテキストチャンネルを ID とともに表示
            for guild in self.guilds:
                for channel in guild.text_channels:
                    print(f" - #{channel.name} (ID: {channel.id})")
        print("------")


async def main():
    bot = DiscordBot()
    async with bot:
        if TOKEN:
            await bot.start(TOKEN)
        else:
            print("WARNING: DISCORD_BOT_TOKEN is not set in .env file.")
            print("Please create a .env file based on .env.example and set your token.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
