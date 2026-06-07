import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Determine if we are in production
const isProduction = process.env.NODE_ENV === "production";

// Lazy initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Chatbot will run in simulation mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: isProduction ? "production" : "development" });
  });

  // API Route: Roommate Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { roommate, messages } = req.body;
      if (!roommate || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Missing roommate profile or messages array." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      
      // Formulate a beautiful prompt for Gemini representing the roommate
      const sysInstruction = `
Bạn là ${roommate.name}, ${roommate.age} tuổi, đang làm nghề/vai trò là ${roommate.role} tại ${roommate.location}.
Thông tin cá nhân của bạn: "${roommate.bio}".
Phong cách sống của bạn:
- Ngủ nghỉ: ${roommate.lifestyle?.sleep || "Bình thường"}
- Thú cưng: ${roommate.lifestyle?.pets || "Thoải mái"}
- Hút thuốc: ${roommate.lifestyle?.smoke || "Không hút thuốc"}
- Nấu ăn: ${roommate.lifestyle?.cook || "Bình thường"}
- Giao tiếp: ${roommate.lifestyle?.interaction || "Cân bằng"}
- Ngăn nắp: ${roommate.lifestyle?.neatness || "Sạch sẽ"}

Nhiệm vụ: Hãy đóng vai là ${roommate.name} để trò chuyện nhắn tin với người dùng (người đang muốn tìm phòng trọ hoặc tìm roommate ở ghép chung).
Yêu cầu phong cách:
- Trò chuyện tự nhiên, thân thiện, đậm chất Gen Z Việt Nam nhưng vẫn lịch sự, tôn trọng đối tác tiềm năng.
- Sử dụng xưng hô phù hợp (ví dụ xưng "mình", "cậu" hoặc "bạn", "tớ" tùy theo độ tuổi và vai trò, mang tính chất thân mật).
- Phản hồi ngắn gọn, súc tích (khoảng 1-3 câu dài tối đa), thích hợp với giao diện nhắn tin điện thoại. Tránh viết quá dài dòng dông dài.
- Giữ đúng các đặc trưng lối sống của bạn (ví dụ nếu không hút thuốc hoặc thích sạch sẽ, hãy nhấn mạnh khía cạnh đó nếu được hỏi).
      `.trim();

      if (!apiKey) {
        // Fallback simulation mode if API key is not set
        const lastMsg = messages[messages.length - 1]?.text || "";
        let simulationResponse = `Chào bạn nha! Mình là ${roommate.name}. Rất vui được nhắn tin với bạn! (Hệ thống đang chạy chế độ mô phỏng)`;
        
        if (lastMsg.toLowerCase().includes("chào") || lastMsg.toLowerCase().includes("hi") || lastMsg.toLowerCase().includes("hello")) {
          simulationResponse = `Chào bạn! Mình là ${roommate.name}. Rất vui được kết nối với bạn nha. Bạn thấy hồ sơ của mình thế nào? 😊`;
        } else if (lastMsg.toLowerCase().includes("tiền") || lastMsg.toLowerCase().includes("giá") || lastMsg.toLowerCase().includes("kinh phí") || lastMsg.toLowerCase().includes("phòng")) {
          simulationResponse = `À về chi phí phòng thì ngân sách tối đa của mình khoảng ${(roommate.budget / 1000000).toFixed(1)} triệu/tháng nè. Chúng mình có thể chia đôi tiền điện nước mạng nữa nha.`;
        } else if (lastMsg.toLowerCase().includes("thú cưng") || lastMsg.toLowerCase().includes("chó") || lastMsg.toLowerCase().includes("mèo")) {
          simulationResponse = `Về thú cưng thì mình là người ${roommate.lifestyle?.pets}. Bạn có nuôi bé nào không, nuôi chung cho vui nè!`;
        } else if (lastMsg.toLowerCase().includes("sạch") || lastMsg.toLowerCase().includes("vệ sinh") || lastMsg.toLowerCase().includes("dọn dẹp")) {
          simulationResponse = `Đúng rồi á! Mình rất coi trọng việc giữ gìn vệ sinh chung, phòng ngủ và không gian chung sạch sẽ thì ở mới thoải mái được chứ nhỉ.`;
        } else if (lastMsg.toLowerCase().includes("ở đâu") || lastMsg.toLowerCase().includes("địa chỉ") || lastMsg.toLowerCase().includes("vị trí")) {
          simulationResponse = `Hiện tại mình đang tìm phòng ở quanh khu vực ${roommate.location}. Bạn có sẵn phòng hay đang tìm phòng trống ở chung vậy?`;
        } else if (lastMsg.toLowerCase().includes("thỏa thuận") || lastMsg.toLowerCase().includes("hợp đồng") || lastMsg.toLowerCase().includes("cam kết")) {
          simulationResponse = `Tuyệt quá! Chúng ta nên tạo một Bản Thỏa Thuận Ở Chung để thống nhất các quy tắc sinh hoạt cho rõ ràng nha. Bạn qua tab Thỏa Thuận Ở Chung ký tên đi nè!`;
        } else {
          simulationResponse = `Nghe hợp lý á! Mình cảm thấy lối sống của tụi mình khá hợp nhau đó. Hôm nào rảnh tụi mình hẹn ra quán cafe gặp mặt trực tiếp trao đổi thêm nhé? ✨`;
        }
        return res.json({ text: simulationResponse });
      }

      // Convert chat history to Gemini format (user vs model)
      const ai = getGenAI();
      const contents = messages.map((msg: any) => ({
        role: msg.senderId === "me" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: sysInstruction,
          temperature: 0.8,
        }
      });

      res.json({ text: result.text || "Xin lỗi, mình chưa nghe rõ..." });
    } catch (error: any) {
      console.error("Gemini Chat API Error:", error);
      res.status(500).json({ error: error.message || "Lỗi máy chủ khi xử lý yêu cầu chat." });
    }
  });

  // API Route: Generate Agreement Summary
  app.post("/api/generate-agreement-summary", async (req, res) => {
    try {
      const { userName, roommateName, rulesDetails } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const prompt = `
Xây dựng một "Bản Chứng Nhận Thỏa Thuận Ở Chung" (Roommate Agreement Certificate) vô cùng ngắn gọn, hài hước nhưng cực kì văn minh và lịch sự, ký kết giữa hai bạn trẻ Gen Z:
- Người ký 1: ${userName || "Bạn"}
- Người ký 2: ${roommateName || "Roommate"}

Các quy tắc được hai bên cùng đồng ý cam kết thực hiện:
${rulesDetails.cleaning ? "- ✔ Lịch dọn vệ sinh chung: Phân công luân phiên dọn dẹp không gian chung (bếp, sảnh, WC) hàng tuần sòng phẳng." : "- ✖ Không bắt buộc lịch dọn dẹp chung cố định (tự giác là chính)."}
${rulesDetails.noise ? "- ✔ Giờ giới nghiêm tiếng ồn: Giữ im lặng tuyệt đối từ 11:00 PM đến 6:00 AM sáng hôm sau để giữ giấc ngủ vàng ngọc." : "- ✖ Quy định tiếng ồn: Linh hoạt, tự thỏa thuận trực tiếp khi cần."}
${rulesDetails.visitors ? "- ✔ Quy tắc đưa bạn về chơi: Phải thông báo trước ít nhất 1 ngày. Cam kết khách không ngủ qua đêm bừa bãi." : "- ✖ Đưa bạn bè về chơi thoải mái, khách có thể ngủ lại ngắn ngày nếu cần."}
${rulesDetails.pets ? "- ✔ Nuôi thú cưng: Đồng ý chấp nhận nuôi thú nhỏ và tự chịu hoàn toàn trách nhiệm dọn dẹp vệ sinh cho bé cưng." : "- ✖ Cấm nuôi thú cưng trong phòng để tránh mùi rụng lông và tiền phạt."}
${rulesDetails.bills ? "- ✔ Chia sẻ hóa đơn (Điện, Nước, Mạng): Thanh toán đúng hẹn mùng 1 đến mùng 5 hàng tháng, chia đôi sòng phẳng 50/50." : "- ✖ Không chia hóa đơn cố định, thỏa thuận riêng từng tháng."}

Hãy viết một văn bản chứng nhận có tiêu đề trang trọng: "BẢN THỎA THUẬN CAM KẾT SỐNG HÒA HỢP".
Văn bản dài khoảng 2-3 đoạn văn ngắn, có mở đầu hoành tráng, hài hước, liệt kê lại các điều khoản họ đồng ý một cách súc tích, tóm tắt tinh thần: "Vì một môi trường sống hòa thuận, không xích mích, không toxic, nâng đỡ nhau cùng phát triển". Cuối cùng có câu chúc mừng họ đã tìm thấy nhau. Trả về định dạng Markdown đẹp mắt.
      `.trim();

      if (!apiKey) {
        // Mock simulation response
        const mockMd = `
### 📜 BẢN THỎA THUẬN CAM KẾT SỐNG HÒA HỢP
**Được thiết lập bởi ${userName || "Tên bạn"} và ${roommateName || "Minh Anh"}**

Vì một cuộc sống ở ghép tràn đầy năng lượng tích cực, dẹp tan mọi định kiến về việc "ghép đôi toxic", hai bên long trọng đặt bút (điện tử) ký tên cam kết tuân thủ các điều khoản vàng ngọc sau đây:

1. ${rulesDetails.cleaning ? "🧹 **Lịch vệ sinh luân phiên**: Chia ca rõ ràng, không để dồn đống chén bát, giữ nhà cửa thơm tho như spa." : "🧹 **Tự giác vệ sinh**: Không áp lịch cứng, bẩn là dọn, không đùn đẩy."}
2. ${rulesDetails.noise ? "🔇 **Yên lặng ban đêm**: Sau 11:00 PM, tắt loa lớn, đi nhẹ nói khẽ cười duyên để đối phương ngon giấc." : "🔇 **Giờ giấc tự do**: Tiếng ồn ở mức chấp nhận được, tôn trọng giấc ngủ của nhau."}
3. ${rulesDetails.visitors ? "👥 **Tôn trọng riêng tư**: Bạn bè đến chơi báo trước 24h, tuyệt đối không biến phòng ngủ thành ký túc xá tự do ngủ qua đêm." : "👥 **Thoải mái đón khách**: Đón tiếp bạn bè lịch sự, vui vẻ."}
4. ${rulesDetails.pets ? "🐾 **Nuôi thú cưng văn minh**: Thú nhỏ nuôi được nhưng chủ phải lo vệ sinh từ A-Z, không làm phiền người kia." : "🐾 **Không nuôi thú cưng**: Không gian trong lành nói không với lông và mùi."}
5. ${rulesDetails.bills ? "💰 **Hóa đơn sòng phẳng**: Điện nước mạng thanh toán 1-5 hàng tháng, chia đều 50/50, không chậm trễ dù chỉ 1 đồng." : "💰 **Đóng tiền linh hoạt**: Đóng góp đúng hạn theo thỏa thuận riêng."}

> **Tuân thủ cam kết - Gặt hái tình bạn!**
Chúc hai bạn có những năm tháng chung sống hạnh phúc, cùng nhau nấu nướng, học tập và gặt hái thành công rực rỡ dưới một mái nhà! 🎉
        `.trim();
        return res.json({ markdown: mockMd });
      }

      const ai = getGenAI();
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ markdown: result.text || "Chúc hai bạn sống hòa thuận vui vẻ!" });
    } catch (error: any) {
      console.error("Gemini Summary API Error:", error);
      res.status(500).json({ error: error.message || "Lỗi máy chủ khi tạo văn bản." });
    }
  });

  // Vite Integration for Dev / Static serving for Production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static frontend assets
    app.use(express.static(distPath));
    
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RoomieMatch Server] Listening on http://localhost:${PORT} [${isProduction ? "PRODUCTION" : "DEVELOPMENT"}]`);
  });
}

startServer();
