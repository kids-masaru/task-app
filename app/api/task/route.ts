import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@notionhq/client';

export async function POST(req: NextRequest) {
  try {
    const { text, url, model: selectedModel, timeSlot, databaseId, relationId, selectedDate } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. Process with Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: selectedModel || 'gemini-2.0-flash' });

    const currentDate = new Date();
    // Use selectedDate if provided, otherwise use current date
    const targetDate = selectedDate || currentDate.toISOString().split('T')[0];

    const prompt = `
      Current Date and Time: ${currentDate.toISOString()}
      Target Date for Tasks: ${targetDate}
      
      Analyze the following text and extract ALL tasks into a JSON array. If the user mentions multiple tasks, create separate entries for each.
      
      Text: "${text}"
      
      Requirements:
      1. "name": Create a concise task title in Japanese following this format: 【行動】一言まとめ
         - 行動 (Action): Choose an appropriate action verb from: 確認, 整理, 調整, 作成, 電話, 会議, 連絡, 検討, 準備, 実施, 報告, 相談, 打合せ, 依頼, 対応, etc.
         - 一言まとめ (Summary): A brief 2-5 word summary of what needs to be done
         - Examples: 【確認】Slackの内容, 【整理】開園タスク, 【調整】会議日時, 【作成】台本, 【電話】処遇改善について
         - Analyze the content carefully to determine the most appropriate action verb for EACH task
      
      2. "date": Use the Target Date (${targetDate}) as the default date for all tasks. Only use a different date if the text explicitly mentions a specific date that differs from the target date.
      
      3. "details": Create a detailed, structured summary of the task content in Japanese.
         - Organize the information clearly (e.g., Who, What, When, Where, Why).
         - Include any specific numbers, dates, or names mentioned.
         - Format it to be easily readable as a task description.
         - Do NOT just copy the input text. Summarize and restructure it relevant to this specific task.
         - Use bullet points or clear sections if appropriate.
      
      4. If the text contains multiple tasks (e.g., "○○ってタスクと●●ってタスク作って"), create separate entries for each task.
      
      5. If only one task is mentioned, still return an array with one item.
      
      Output strictly valid JSON array only. No markdown formatting.
      Example for single task: [{"name": "【確認】Slackの内容", "date": "${targetDate}", "details": "・対象: Slackの未読メッセージ\\n・アクション: 内容を確認し、必要なものに返信する\\n・期限: 本日中"}]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Clean up markdown code blocks if present
    const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    let tasksData: any[];
    try {
      const parsed = JSON.parse(cleanedJson);
      // Ensure it's always an array
      tasksData = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.error("Failed to parse Gemini response:", textResponse);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // 2. Save each task to Notion
    // Select the appropriate API key based on the database
    let notionApiKey = process.env.NOTION_API_KEY;
    const targetDatabaseId = databaseId || process.env.NOTION_DATABASE_ID;

    // If using the second database, use the second API key
    if (targetDatabaseId === process.env.NOTION_DATABASE_ID_2 && process.env.NOTION_API_KEY_2) {
      notionApiKey = process.env.NOTION_API_KEY_2;
    }

    const notion = new Client({ auth: notionApiKey });

    if (!targetDatabaseId) {
      // For testing without Notion
      console.log("Notion Database ID not set. Skipping Notion save.", tasksData);
      return NextResponse.json({
        success: true,
        data: tasksData.map(task => ({ ...task, time_slot: timeSlot })),
        message: "Notion save skipped (no DB ID)"
      });
    }

    // Create all tasks
    const createdTasks: any[] = [];

    for (const taskData of tasksData) {
      const children: any[] = [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: taskData.details || text, // Use summarized details, fallback to original text
                },
              },
            ],
          },
        },
      ];

      if (url) {
        children.push({
          object: 'block',
          type: 'bookmark',
          bookmark: {
            url: url,
          },
        });
      }

      const pageProperties: any = {
        Name: {
          title: [
            {
              text: {
                content: taskData.name,
              },
            },
          ],
        },
        Date: {
          date: {
            start: taskData.date,
          },
        },
      };

      // Only add time slot if this database supports it
      const databaseWithTimeslot = process.env.NOTION_DATABASE_WITH_TIMESLOT || process.env.NOTION_DATABASE_ID;
      if (targetDatabaseId === databaseWithTimeslot) {
        pageProperties["時間帯"] = {
          select: {
            name: timeSlot || "12:00-16:00",
          },
        };
        pageProperties["獲得"] = {
          checkbox: true,
        };
      }

      // Add relation property if selected
      if (relationId) {
        let relationPropertyName = null;

        // Determine which relation property to use based on database
        if (targetDatabaseId === process.env.NOTION_DATABASE_ID) {
          relationPropertyName = process.env.NOTION_RELATION_PROPERTY_1 || "クライアント";
        } else if (targetDatabaseId === process.env.NOTION_DATABASE_ID_2) {
          relationPropertyName = process.env.NOTION_RELATION_PROPERTY_2 || "クライアントDB";
        }

        if (relationPropertyName) {
          pageProperties[relationPropertyName] = {
            relation: [{ id: relationId }]
          };
        }
      }

      await notion.pages.create({
        parent: { database_id: targetDatabaseId },
        icon: {
          type: "external",
          external: {
            url: "https://www.notion.so/icons/robot_purple.svg"
          }
        },
        properties: pageProperties,
        children: children,
      });

      createdTasks.push({ ...taskData, time_slot: timeSlot });
    }

    return NextResponse.json({
      success: true,
      data: createdTasks,
      count: createdTasks.length
    });

  } catch (error: any) {
    console.error('Error processing task:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
