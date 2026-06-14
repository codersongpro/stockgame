import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface Asset {
  outPath: string;
  prompt: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
}

const STYLE =
  "cute isometric 2D illustration, chibi cartoon style, Korean webtoon inspired, pastel color palette, soft shadows, clean lines, white background, no text, no watermark, game asset style.";

const ASSETS: Asset[] = [
  // 건물 내부 (8종)
  {
    outPath: "buildings/factory.png",
    prompt: `${STYLE} Factory interior: conveyor belt with small boxes, robotic arm, yellow helmet on wall hook, orange and grey tones, cheerful industrial scene`,
  },
  {
    outPath: "buildings/rnd.png",
    prompt: `${STYLE} Science lab interior: glowing blue test tubes, microscope, laptop with graphs, whiteboard with equations, purple and teal tones, cozy research atmosphere`,
  },
  {
    outPath: "buildings/office.png",
    prompt: `${STYLE} Modern office interior: desks with computers, potted plants, city window view, blue and white tones, organized corporate feel`,
  },
  {
    outPath: "buildings/store.png",
    prompt: `${STYLE} Cute retail store interior: shelves with colorful products, checkout counter, shopping bags, mint green and pink tones, welcoming atmosphere`,
  },
  {
    outPath: "buildings/cafeteria.png",
    prompt: `${STYLE} Company cafeteria interior: round tables with chairs, serving counter with Korean food trays, warm yellow and orange tones, steam rising from food, cozy lunch area`,
  },
  {
    outPath: "buildings/gym.png",
    prompt: `${STYLE} Small company gym interior: treadmills, dumbbells on rack, yoga mats, motivational posters, fresh blue and green tones, energetic atmosphere`,
  },
  {
    outPath: "buildings/daycare.png",
    prompt: `${STYLE} Workplace daycare interior: colorful toy blocks, small desks, crayon drawings on wall, rainbow rug, soft pastel pink and yellow tones, safe and cheerful`,
  },
  {
    outPath: "buildings/clinic.png",
    prompt: `${STYLE} Small company clinic interior: examination bed, medicine cabinet, first aid kit, green cross symbol, clean white and mint tones, calm healing atmosphere`,
  },
  // 캐릭터 (6종)
  {
    outPath: "characters/ceo.png",
    prompt:
      "cute chibi character portrait, Korean webtoon style, confident business CEO, wearing navy suit, short hair, slight smile, pastel background circle, game UI avatar style, white background, no text, square format",
  },
  {
    outPath: "characters/engineer.png",
    prompt:
      "cute chibi character portrait, Korean webtoon style, young engineer, wearing casual hoodie, glasses, holding laptop, curious expression, pastel blue background circle, game UI avatar style, white background, no text, square format",
  },
  {
    outPath: "characters/marketer.png",
    prompt:
      "cute chibi character portrait, Korean webtoon style, energetic marketing person, bright clothes, holding megaphone, big smile, pastel pink background circle, game UI avatar style, white background, no text, square format",
  },
  {
    outPath: "characters/finance.png",
    prompt:
      "cute chibi character portrait, Korean webtoon style, serious finance person, formal vest, holding chart document, calm expression, pastel green background circle, game UI avatar style, white background, no text, square format",
  },
  {
    outPath: "characters/scientist.png",
    prompt:
      "cute chibi character portrait, Korean webtoon style, excited scientist, lab coat, wild hair, holding test tube, enthusiastic expression, pastel purple background circle, game UI avatar style, white background, no text, square format",
  },
  {
    outPath: "characters/hr.png",
    prompt:
      "cute chibi character portrait, Korean webtoon style, friendly HR person, warm smile, clipboard in hand, casual business attire, pastel yellow background circle, game UI avatar style, white background, no text, square format",
  },
  // 이벤트 아이콘 (3종)
  {
    outPath: "events/positive.png",
    prompt:
      "cute chibi icon, Korean webtoon style, celebration business event, golden trophy with sparkles, confetti, green and gold colors, circular composition, white background, no text, simple flat icon game style",
  },
  {
    outPath: "events/negative.png",
    prompt:
      "cute chibi icon, Korean webtoon style, business crisis event, red downward arrow with lightning bolt, worried face emoji style, red and dark blue colors, circular composition, white background, no text, simple flat icon game style",
  },
  {
    outPath: "events/neutral.png",
    prompt:
      "cute chibi icon, Korean webtoon style, news bulletin event, newspaper with magnifying glass, neutral blue and grey colors, circular composition, white background, no text, simple flat icon game style",
  },
  // 히어로 배너 (와이드)
  {
    outPath: "hero.png",
    size: "1536x1024",
    prompt:
      "cute isometric city panorama, chibi cartoon style, Korean webtoon inspired, fantasy business city at golden hour, unicorn flying over tall colorful office buildings, happy citizens walking, lush trees and parks, bright pastel gradient sky purple to orange, cinematic wide shot, game title screen illustration, no text, no watermark, ultra detailed",
  },
];

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY 환경변수가 필요합니다.");
    console.error("   OPENAI_API_KEY=sk-... npx tsx scripts/generate-assets.ts");
    process.exit(1);
  }

  const base = path.join(process.cwd(), "public", "assets");
  let ok = 0;
  let fail = 0;

  for (const asset of ASSETS) {
    const dest = path.join(base, asset.outPath);
    if (fs.existsSync(dest)) {
      console.log(`⏭  건너뜀 (이미 존재): ${asset.outPath}`);
      ok++;
      continue;
    }

    console.log(`🎨 생성 중: ${asset.outPath}`);
    try {
      const response = await client.images.generate({
        model: "gpt-image-2",
        prompt: asset.prompt,
        size: asset.size ?? "1024x1024",
        n: 1,
      });

      const b64 = response.data[0].b64_json;
      if (!b64) throw new Error("이미지 데이터를 받지 못했습니다.");

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(b64, "base64"));
      console.log(`✅ 저장됨: ${asset.outPath}`);
      ok++;
    } catch (err) {
      console.error(`❌ 실패: ${asset.outPath}`, (err as Error).message);
      fail++;
    }

    // rate limit 방지
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n🎉 완료! 성공 ${ok}개, 실패 ${fail}개`);
  console.log("   public/assets/ 폴더를 확인하세요.");
}

main().catch(console.error);
