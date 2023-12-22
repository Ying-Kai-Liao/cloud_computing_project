import { config as dotenvConfig } from "dotenv";
import {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
  TextChannel,
  GuildChannel,
} from "discord.js";
import { transcribe } from "./utils/transcriber";
import runConversation from "./utils/tojson";
import createUser from "./api/sign_up";
import createRecord from "./api/record";

dotenvConfig();

const channelID = process.env.CHANNEL_ID;
const token = process.env.TOKEN;

console.log(token);

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  const channelName = "form";
  const channel = client.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      (c as TextChannel).name === channelName
  ) as TextChannel; // Only TextChannel can send messages

  if (channel) {
    channel.send(`病歷卡機器人，表單內容如下：
    姓名：
    性別：
    生日：(西元年)
    住址：
    入院日期：
    近一個月有無國外旅遊史：
    近一個月有無禽鳥接觸史：
    近14日內有無發燒：
    教育程度：
    就業狀況：
    婚姻狀況：
    住所：(是否與家人同住)
    抽菸史：(含電子煙)(頻率)
    喝酒史：(頻率)

    請依內容語音回答即可
    `);
  } else {
    console.log("Channel not found");
  }
});

client.on("messageCreate", (message) => {
  // Living test
  if (message.content === "ping") {
    message.reply("pong");
  }
  if (message.attachments.size > 0) {
    message.attachments.forEach(async (attachment) => {
      // Log attachment data
      // console.log('Attachment URL:', attachment.url);
      // console.log('Attachment Name:', attachment.name);
      // console.log('Attachment Size:', attachment.size);

      if (attachment.contentType !== "audio/ogg") {
        return;
      }
      createUser({
        name: message.author.globalName as string,
        discordId: message.author.id,
      });
      const recievedText = await transcribe(attachment.url);
      const data = await runConversation(recievedText);
      const record = await createRecord({
        discordId: message.author.id,
        arriveTime: data?.arrive_time,
        abroadRecord: data?.abroad_record,
        birdRecord: data?.bird_record,
        feverRecord: data?.fever_record,
        alcoholFrequency: data?.alcohol_frequency,
        smokingFrequency: data?.smoking_frequency,
        ...data,
      });
      if (!record) return 
      message.reply(`
      目前表單填寫進度：

      姓名：${record.name}
      性別：${record.gender}
      生日：${record.birth}
      住址：${record.address}
      入院日期：${record.arriveTime}
      近一個月有無國外旅遊史：${record.abroadRecord}
      近一個月有無禽鳥接觸史：${record.birdRecord}
      近14日內有無發燒：${record.feverRecord}
      教育程度：${record.education}
      就業狀況：${record.employment}
      婚姻狀況：${record.marriage}
      住所：${record.living}
      抽菸史：(含電子煙)${record.smokingFrequency}
      喝酒史：${record.alcoholFrequency}

      若已經完成，可以繼續更正
      `)

    });
  }
});

// Log in to Discord with client token
client.login(token);
