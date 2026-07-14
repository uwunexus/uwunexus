# Part 24: Feature 09 - Info Hub / Learn LMS (Markdown භාවිතය)

අපේ Project එකේ තියෙන තවත් ලස්සන Feature එකක් තමයි කැම්පස් එක ගැන විස්තර, පාඩම්, හෝ වෙනත් තොරතුරු ලස්සනට පෙන්වන Info Hub එක (නැත්නම් Learn LMS එක).

මේකෙදි අපි Database එකේ ලොකු ඡේද ගණන් (Paragraphs) සේව් කරන්නේ නැහැ. ඒ වෙනුවට අපි පාවිච්චි කරන්නේ **Markdown (`.md`)** කියන ෆයිල් ජාතියයි. ඔයා දැන් මේ කියවන ෆයිල් එකත් ලියලා තියෙන්නේ Markdown වලින්! 

අපි බලමු මේක වෙබ්සයිට් එක ඇතුළේ වැඩ කරන්නේ කොහොමද කියලා.

---

## 1. Markdown කියන්නේ මොකක්ද?

සාමාන්‍යයෙන් වෙබ්සයිට් එකක මාතෘකාවක් ලොකුවට දාන්න ඕනේ නම් අපි `<h1>මාතෘකාව</h1>` කියලා HTML කෝඩ් එකක් ලියන්න ඕනේ. ඒක ලියන්න කරදරයි. 

හැබැයි Markdown වලදී අපි කරන්නේ `# මාතෘකාව` කියලා ලියන එක විතරයි! 
* `#` දැම්මම ලොකු මාතෘකා
* `**වචනය**` දැම්මම තද අකුරු (Bold)
* `- වචනය` දැම්මම ලයිස්තුවක් (Bullet points)

මේ විදිහට හරිම ලේසියෙන් ෆයිල් එකක් හදාගන්න පුළුවන් (හරියටම අපේ මේ Guide එකේ තියෙන ෆයිල් වගේ).

## 2. Frontend එක (`app/learn/LearnClient.tsx`)

අපේ Project එකේ මේ Markdown ෆයිල් අරගෙන වෙබ්සයිට් එකට තේරෙන HTML බවට හරවන්නේ කොහොමද කියලා බලමු.

```tsx
import { useState, useEffect } from "react";
import Markdown from "react-markdown"; // මේක තමයි මැජික් එක කරන Component එක

export default function LearnLMS() {
    
    // 1. තෝරපු පාඩමේ නම මතක තියාගන්නවා
    const [selectedLesson, setSelectedLesson] = useState("intro.md");
    
    // 2. ඒ පාඩමේ තියෙන අකුරු (Content) ටික මතක තියාගන්නවා
    const [markdownContent, setMarkdownContent] = useState("");

    // 3. තෝරපු පාඩම වෙනස් වුණු ගමන් මේක වැඩ කරනවා (useEffect)
    useEffect(() => {
        
        // අදාළ .md ෆයිල් එක අපේ ෆෝල්ඩරයෙන් (public/guide/) අරගෙන කියවනවා
        fetch(`/guide/${selectedLesson}`)
            .then(res => res.text()) // මේක JSON නෙවෙයි, සාමාන්‍ය අකුරු (text)
            .then(text => {
                setMarkdownContent(text); // ඒ අකුරු ටික පෙට්ටියට දානවා
            });
            
    }, [selectedLesson]); // selectedLesson එක වෙනස් වෙද්දී විතරක් මේක ආයෙත් දුවනවා

    return (
        <div className="flex">
            {/* වම් පැත්තේ තියෙන Menu එක (මෙතනින් ක්ලික් කරාම setSelectedLesson එකෙන් පාඩම මාරු වෙනවා) */}
            <div className="sidebar">
                <button onClick={() => setSelectedLesson("intro.md")}>හැඳින්වීම</button>
                <button onClick={() => setSelectedLesson("advanced.md")}>ගැඹුරු පාඩම්</button>
            </div>

            {/* දකුණු පැත්තේ පාඩම පෙන්වන තැන */}
            <div className="content">
                {/* 4. අර Markdown Component එකට අපේ අකුරු ටික දුන්නම, එයා ඒක ලස්සන HTML වලට හරවනවා! */}
                <Markdown>{markdownContent}</Markdown>
            </div>
        </div>
    );
}
```

## 3. මෙතනදී වෙන දේ පියවරෙන් පියවර:

1. මුලින්ම බ්‍රව්සර් එකට `intro.md` කියන ෆයිල් එක ඕනේ කියලා අපි කියනවා (`useState`).
2. `useEffect` එකෙන් ඒ ෆයිල් එක අපේ Project එකේ `public/guide/` ෆෝල්ඩරයෙන් හොයාගෙන කියවනවා (`fetch`).
3. කියවපු සාමාන්‍ය අකුරු ටික (උදා: `# මාතෘකාව`) අරගෙන **`<Markdown>`** කියන විශේෂ Component එක ඇතුළට දානවා.
4. ඒ විශේෂ Component එකෙන් `# මාතෘකාව` කියන එක දැක්ක ගමන්, ඒක ලොකු `<h1>` එකකට (ලස්සන මාතෘකාවකට) හරවලා තිරයේ පෙන්වනවා.

> **සාරාංශය:**
> * විශාල ලිපි හෝ පාඩම් සේව් කරන්න Database එකක් පාවිච්චි කරනවට වඩා **Markdown (`.md`)** ෆයිල් පාවිච්චි කරන එක ලේසියි වගේම වේගවත්.
> * Frontend එකේදී ඒ ෆයිල් එක `fetch` කරලා, **`react-markdown`** වගේ Component එකක් හරහා ඒක ලස්සනට තිරයේ අඳිනවා.

අපේ Project එකේ තියෙන ළමයි පාවිච්චි කරන ප්‍රධාන Features ඔක්කොම දැන් ඔයා දන්නවා. ඊළඟ පාඩමෙන් අපි බලන්නේ **Admin Panel එක (පරිපාලක මණ්ඩලය)** ගැනයි. ළමයි දාන ඉවෙන්ට්ස් Approve/Reject කරන්නේ කොහොමද කියලා එතනදී බලමු!
