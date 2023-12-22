import { config as configDotenv } from "dotenv";
import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";
import { FormData } from "../types";

configDotenv();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// function call openai 
// the defined function
function fillForm({
  name,
  gender,
  birth,
  abroad_record = false,
  bird_record = false,
  fever_record = false,
  education,
  employment,
  marriage,
  living,
  address,
  alcohol_frequency,
  smoking_frequency,
  arrive_time = new Date().toLocaleString()
}: Partial<FormData>): FormData {
  return {
    name,
    gender,
    birth,
    abroad_record,
    bird_record,
    fever_record,
    education,
    employment,
    marriage,
    living,
    address,
    alcohol_frequency,
    smoking_frequency,
    arrive_time
  };
}

export default async function runConversation(
  message = ""
) {
  // Step 1: send the conversation and available functions to the model
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: message,
    },
    // Propmt to chatGPT
    {
      role: "system",
      content:
        "You are a form filling assistant which parse the usable data to the form and fill the form for users. If can't fill it , just leave it blank",
    },
  ];
  const tools = [
    {
      type: "function",
      function: {
        name: "fill_form",
        description: "Fill the form with patient data",
        parameters: {
          type: "object",
          properties: {
            arrive_time: {
              type: "string",
              description:
                "The arrival time of the patient, e.g. '2022-12-31 23:59:59'",
            },
            name: {
              type: "string",
              description: 
                "The name of the patient."
            },
            gender: {
              type: "string",
              enum: ["male", "female"],
            },
            birth: {
              type: "string",
              description: "The birth date of the patient, e.g. '1990-01-01'",
            },
            abroad_record: {
              type: "boolean",
              description: "Whether the patient has a record of being abroad",
              default: false,
            },
            bird_record: {
              type: "boolean",
              description: "Whether the patient has a contact with bird",
              default: false,
            },
            fever_record: {
              type: "boolean",
              description: "Whether the patient has a fever record",
              default: false,
            },
            education: {
              type: "string",
              description:
                "The education level of the patient, e.g. 'High School', 'Bachelor', 'Master'",
            },
            employment: {
              type: "string",
              description:
                "The employment status of the patient, e.g. 'Employed', 'Unemployed'",
            },
            marriage: {
              type: "string",
              enum: ["single", "married", "divorced"],
            },
            living: {
              type: "string",
              description:
                "The living condition of the patient, e.g. 'Alone', 'With Family'",
            },
            address: {
              type: "string",
              description: "The living address of the patient",
            },
            alcohol_frequency: {
              type: "string",
              enum: ["not at all", "sometimes", "everyday"],
            },
            smoking_frequency: {
              type: "string",
              enum: ["not at all", "sometimes", "everyday"],
            },
          },
        },
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: messages as Array<ChatCompletionMessageParam>,
    tools: tools as Array<ChatCompletionTool>,
    tool_choice: "auto", // auto is default, but we'll be explicit
  });

  const responseMessage = response.choices[0].message;

  // Step 2: check if the model wanted to call a function
  const toolCalls = responseMessage.tool_calls;
  if (responseMessage.tool_calls) {
    // Step 3: call the function
    // Note: the JSON response may not always be valid; be sure to handle errors
    const availableFunctions = {
      fill_form: fillForm,
    }; // only one function in this example, but you can have multiple
    messages.push({
      role: "assistant",
      content: responseMessage.content,
    }); 
    for (const toolCall of toolCalls ?? []) {
      const functionName = toolCall.function.name;
      const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      console.log(functionArgs);
      const functionResponse = functionToCall(
       functionArgs
      );
      return functionResponse
      console.log(functionResponse)
      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: functionName,
        content: functionResponse, 
      } as unknown as ChatCompletionMessageParam); 
    }
    // const secondResponse = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo-1106",
    //   messages: messages,
    // }); // get a new response from the model where it can see the function response
    // return secondResponse;
  }
}