import Groq from "groq-sdk";

const groq = new Groq();

const response = await groq.chat.completions.create({
  model: "moonshotai/kimi-k2-instruct-0905",
  messages: [
    { role: "system", content: "Extract product review information from the text." },
    {
      role: "user",
      content: "I bought the UltraSound Headphones last week and I'm really impressed! The noise cancellation is amazing and the battery lasts all day. Sound quality is crisp and clear. I'd give it 4.5 out of 5 stars.",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "product_review",
      schema: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          rating: { type: "number" },
          sentiment: { 
            type: "string",
            enum: ["positive", "negative", "neutral"]
          },
          key_features: { 
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["product_name", "rating", "sentiment", "key_features"],
        additionalProperties: false
      }
    }
  }
});

const result = JSON.parse(response.choices[0].message.content || "{}");
console.log(result);