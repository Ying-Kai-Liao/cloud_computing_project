import { config as configDotenv } from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import axios from "axios";
import { createWriteStream } from "fs";

configDotenv();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Download the file so that OPENAI can read it
async function downloadFile(url: string, path:string) {
  const writer = createWriteStream(path);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Main transcribe function
export async function transcribe(file = "https://cdn.discordapp.com/attachments/1179870788640317562/1187263371410677811/voice-message.ogg") {
  try {
    const path = './audio.ogg'; // any path works, work as temp files
    await downloadFile(file, path);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(path),
      model: "whisper-1",
    });
    // File Delete
    fs.unlink(path, (err) => { 
      if (err) {
        console.error(`Failed to delete file: ${err}`);
      } else {
        // sucessfully deleted temp audio file
        // console.log(`File deleted: ${path}`);
      }
    });
    return transcription.text;
  } catch (error) {
    console.error(`Failed to transcribe: ${error}`);
  }
}

transcribe()