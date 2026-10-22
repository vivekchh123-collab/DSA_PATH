// Run on your own computer: npm run fetch:problems
// Downloads every LeetCode problem into src/data/problems.json (keeps your YouTube links).
import fs from "fs";

const FILE = "src/data/problems.json";
const MAP: [string, string][] = [
  ["Trie", "Tries"], ["Dynamic Programming", "Dynamic Programming"], ["Graph", "Graphs"],
  ["Depth-First Search", "Graphs"], ["Breadth-First Search", "Graphs"], ["Union Find", "Graphs"],
  ["Topological Sort", "Graphs"], ["Binary Search Tree", "Binary Search Trees"],
  ["Binary Tree", "Binary Trees"], ["Tree", "Binary Trees"], ["Heap (Priority Queue)", "Heaps"],
  ["Linked List", "Linked-List"], ["Monotonic Stack", "Stack / Queues"], ["Stack", "Stack / Queues"],
  ["Queue", "Stack / Queues"], ["Sliding Window", "Sliding Window / 2 Pointer"],
  ["Two Pointers", "Sliding Window / 2 Pointer"], ["Binary Search", "Binary Search"],
  ["Bit Manipulation", "Bit Manipulation"], ["Greedy", "Greedy Algorithms"], ["Recursion", "Recursion"],
  ["Backtracking", "Recursion"], ["Hash Table", "Hashing"], ["Sorting", "Sorting"],
  ["String Matching", "Strings (Advanced Algo)"], ["Rolling Hash", "Strings (Advanced Algo)"],
  ["String", "Strings (Basic and Medium)"], ["Math", "Maths"], ["Number Theory", "Maths"], ["Array", "Arrays"],
];
const topicOf = (tags: string[]) => MAP.find(([t]) => tags.includes(t))?.[1] ?? "Maths";

const query = `query($skip:Int,$limit:Int){
  problemsetQuestionList: questionList(categorySlug:"", limit:$limit, skip:$skip, filters:{}){
    total: totalNum
    questions: data { id: questionFrontendId title titleSlug difficulty paidOnly: isPaidOnly topicTags { name } }
  }}`;

async function run() {
  const old: Record<number, string> = {};
  if (fs.existsSync(FILE)) for (const p of JSON.parse(fs.readFileSync(FILE, "utf8"))) old[p.id] = p.youtube;
  const all: any[] = [];
  for (let skip = 0; ; skip += 100) {
    const r = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
      body: JSON.stringify({ query, variables: { skip, limit: 100 } }),
    });
    const list = (await r.json()).data.problemsetQuestionList;
    all.push(...list.questions);
    console.log(`${all.length}/${list.total}`);
    if (all.length >= list.total || list.questions.length === 0) break;
    await new Promise((res) => setTimeout(res, 500));
  }
  const out = all.map((q) => ({
    id: Number(q.id), title: q.title, slug: q.titleSlug, difficulty: q.difficulty,
    premium: q.paidOnly, topic: topicOf(q.topicTags.map((t: any) => t.name)), youtube: old[Number(q.id)] ?? "",
  }));
  fs.writeFileSync(FILE, JSON.stringify(out));
  console.log("Saved", out.length, "problems");
}
run();
