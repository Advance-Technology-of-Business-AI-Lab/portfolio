"use strict";

const environments = {
    desktop: "桌面 Linux · Intel Core i7-14700 · x86_64 · 4 个 CPU 线程 · 2,048-token 上下文",
    android: "Android 15 模拟器 · API 35 · x86_64 · 飞行模式且关闭 Wi-Fi 和移动数据",
};

const parisQuestion = "What is the capital of France?";
const noteQuestion = "Look up the wifi note. What is the guest network name?";
const colorQuestion = "What is the main color in this image? Answer with only the color name.";

function textRun(output, metrics, note) {
    return {
        id: "text", label: "文本 · 法国首都", metrics, note,
        steps: [
            ["输入文本", parisQuestion, "将问题交给本地模型。"],
            ["模型回答", output, "验证记录中的回答。"],
        ],
    };
}

function noteRun(metrics, note) {
    return {
        id: "note", label: "工具 · 查询 Wi-Fi 便签", metrics, note,
        steps: [
            ["输入文本", noteQuestion, "会话附带宿主注册的便签工具。"],
            ["模型请求工具", '{"tool":"lookup_note","arguments":{"key":"wifi"}}', "运行时校验名称和参数。"],
            ["宿主查询便签", "The guest network is Cedar-Guest.", "宿主应用执行本地查询，把便签内容返回给运行时。"],
            ["模型回答", "The guest network is Cedar-Guest.", "验证记录中的回答要点。"],
        ],
    };
}

function imageRun(color, hex, timing, note, label = "") {
    const samples = { Red: "红色样例", Blue: "蓝色样例", Green: "导入的绿色 PNG" };
    const name = samples[color];
    return {
        id: color.toLowerCase(), label: "图像 · " + name, note,
        image: { hex, name: label || name },
        metrics: timing ? [["首段输出", timing], ["观察结果", color]] : [["观察结果", color]],
        steps: [
            ["输入图像与问题", colorQuestion, "色块展示验证样例的颜色。"],
            ["本地图像编码", "vision GGUF + mmproj", "配套投影文件在本地编码图像。"],
            ["模型回答", color, "验证记录中的颜色判断。"],
        ],
    };
}

function calculation(label, input, answer, note) {
    return {
        id: "arithmetic", label, note, metrics: [["记录结果", answer]],
        steps: [
            ["输入运算", input, "用户请求使用本地计算器。"],
            ["执行计算", "calculator", "宿主计算器返回结果。"],
            ["模型回答", answer, "验证记录中的数值。"],
        ],
    };
}

const replayModels = [
    {
        id: "gemma4-e2b", label: "Gemma 4 E2B IT · Q4_0",
        runs: { desktop: [
            textRun("The capital of France is Paris.", [["首段输出", "182 ms"], ["模型加载", "2.96 s"], ["峰值 RSS", "3,940 MiB"]], "Gemma 4 E2B IT Q4_0 桌面文本样本。"),
            noteRun([["首段输出", "2.36 s"], ["工具路由", "1.97 s"], ["生成速度", "18.3 tok/s"], ["峰值 RSS", "4,003 MiB"]], "桌面本地便签工具样本。"),
            calculation("工具 · 计算 12 × 7", "Use the calculator to multiply 12 by 7.", "84.0", "桌面评测的计算器检查。"),
            imageRun("Red", "#ff0000", "", "与蓝图使用同一问题。384 × 384 样例，使用配套 Q8_0 mmproj。验证表中的 1.89 s 属于单次图像链路记录。"),
            imageRun("Blue", "#0000ff", "", "与红图使用同一问题。384 × 384 样例，使用配套 Q8_0 mmproj。"),
            {
                id: "decode", label: "评测 · 持续解码", note: "桌面 LLM 评测套件通过全部五项检查。",
                metrics: [["套件结果", "5 / 5"], ["该轮输出长度", "38 tokens"], ["持续解码", "18.5 tok/s"]],
                steps: [["评测条件", "至少生成 24 个 token", "验证模型可以持续生成。"], ["观察结果", "38 tokens", "该轮达到评测要求。"]],
            },
        ] },
    },
    { id: "gemma4-e4b", label: "Gemma 4 E4B IT · GGUF", runs: {}, note: "这是仓库列出的同架构候选模型，当前公开验证材料尚无可回放记录。" },
    {
        id: "gemma3", label: "Gemma 3 270M IT · Q8_0",
        runs: {
            desktop: [
                textRun("Paris", [["首段输出", "36–44 ms"]], "同一桌面会话中两次回答正确。此处显示报告中的答案摘要。"),
                noteRun([["首段输出", "约 1.02 s"], ["峰值 RSS", "419 MiB"]], "桌面环境的工具样本。"),
                calculation("工具 · 计算 25 + 17", "25 + 17", "42", "桌面冒烟测试，报告记录了求和输入和结果。"),
                {
                    id: "route", label: "评测 · 工具路由偏差", note: "桌面冒烟测试。报告记录了选错工具，未提供最终回复原文。",
                    metrics: [["路由观察", "选中计算器"]],
                    steps: [["输入意图", "查询当前 UTC 时间", "验证模型能否选到时间工具。"], ["观察结果", "calculator", "该次模型选中了计算器。"]],
                },
                {
                    id: "decode", label: "评测 · 持续解码未达标", note: "桌面 LLM 套件中，文本和工具检查通过，持续解码一项未通过。",
                    metrics: [["套件结果", "4 / 5"], ["该轮输出长度", "22 tokens"]],
                    steps: [["评测条件", "至少生成 24 个 token", "验证模型可以持续生成。"], ["观察结果", "22 tokens", "低于该用例的最低要求。"]],
                },
            ],
            android: [
                textRun("Paris", [["首段输出", "0.47 s"], ["工具调用", "无"]], "Android 模拟器飞行模式，报告显示没有工具执行。"),
                noteRun([["首段输出", "1.90 s"]], "Android 模拟器飞行模式下的便签工具样本。"),
            ],
        },
    },
    {
        id: "smollm2", label: "SmolLM2 135M Instruct · Q4_K_M",
        runs: { desktop: [textRun("Paris", [["正确回答", "2 次"]], "文本冒烟测试记录了两次回答正确。工具参数选择不稳定，报告没有完整的可回放调用。")] },
    },
    {
        id: "smolvlm", label: "SmolVLM 256M Instruct · Q8_0",
        runs: {
            desktop: [
                imageRun("Red", "#ff0000", "", "仅有回环接口的 Linux 网络命名空间，输入为 384 × 384 纯红图。"),
                imageRun("Blue", "#0000ff", "", "仅有回环接口的 Linux 网络命名空间，输入为 384 × 384 纯蓝图。"),
            ],
            android: [
                imageRun("Red", "#ef5350", "5.85 s", "Android 控制台中选择内置红色样例。"),
                imageRun("Blue", "#5b7cfa", "8.67 s", "Android 控制台中选择内置蓝色样例。"),
                imageRun("Green", "#26a65b", "8.79 s", "从 Android 本地存储导入绿色 PNG。", "绿色示意色块"),
            ],
        },
    },
];
