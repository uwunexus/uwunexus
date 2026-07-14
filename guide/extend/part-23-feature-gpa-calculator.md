# Part 23: Feature 08 - GPA Calculator (ලකුණු ගණනය කිරීම)

කැම්පස් ළමයින්ට තමන්ගේ ප්‍රතිඵල ආවම GPA එක කීයද කියලා බලාගන්න මේ Feature එක ගොඩක් වැදගත්. මේ වෙනකන් අපි කතා කරපු හැම Feature එකක්ම වගේ (Login, Events, Marketplace) වැඩ කළේ Frontend එකයි Backend (Database) එකයි එකතු වෙලයි.

හැබැයි මේ **GPA Calculator එකේදී Database එකක් (PHP) කිසිසේත්ම පාවිච්චි වෙන්නේ නැහැ!** මේක සම්පූර්ණයෙන්ම වැඩ කරන්නේ ඔයාගේ බ්‍රව්සර් එක ඇතුළෙමයි (Frontend). අපි බලමු ඒ කොහොමද කියලා.

---

## 1. මතක තියාගන්න පෙට්ටිය (`useState`)

කලින් පාඩම් වලදී අපි `useState` පාවිච්චි කළේ එක දත්තයක් (උදා: ඊමේල් එකක්) තියාගන්න. හැබැයි මේකෙදි අපිට විෂයන් (Subjects) ගොඩක් මතක තියාගන්න ඕනේ. ඒකට අපි විෂයන් ගොඩක් දාන්න පුළුවන් Array එකක් (ලොකු පෙට්ටියක්) හදාගන්නවා.

**`app/tools/gpa/page.tsx` කේතය:**

```tsx
import { useState } from "react";

export default function GPACalculator() {
    
    // 1. විෂයන් ගොඩක් මතක තියාගන්න Array එකක්
    const [courses, setCourses] = useState([
        { id: 1, name: "Maths", credits: 3, grade: "A" },
        { id: 2, name: "Programming", credits: 4, grade: "B+" }
    ]);

    // 2. අලුත් විෂයක් එකතු කරන බොත්තම එබුවම
    const addCourse = () => {
        const newCourse = { id: Date.now(), name: "", credits: 0, grade: "A" };
        
        // පරණ විෂයන් ටිකට අලුත් එකත් එකතු කරලා ආයේ සේව් කරනවා
        setCourses([...courses, newCourse]);
    };
    
    // ...
```

## 2. ලකුණු ගණනය කිරීම (The Logic)

සාමාන්‍යයෙන් GPA එකක් හදන්නේ මෙහෙමයි: **(Credit ගාණ × Grade එකේ වටිනාකම) / මුළු Credits ගාණ**. 

මේකට අපි වෙනම Function එකක් ලියනවා Component එක ඇතුළෙම.

```tsx
    // 3. GPA එක ගණනය කරන Function එක
    const calculateGPA = () => {
        let totalPoints = 0;
        let totalCredits = 0;

        // Grade අකුරුවල වටිනාකම
        const gradeValues = {
            "A+": 4.0, "A": 4.0, "A-": 3.7,
            "B+": 3.3, "B": 3.0, "B-": 2.7,
            "C+": 2.3, "C": 2.0, "C-": 1.7,
            "D": 1.0, "F": 0.0
        };

        // විෂයන් ටික එකින් එක අරන් ගණන් හදනවා (Loop)
        courses.forEach(course => {
            if (course.credits > 0 && gradeValues[course.grade] !== undefined) {
                totalPoints += course.credits * gradeValues[course.grade];
                totalCredits += course.credits;
            }
        });

        // 0න් බෙදෙන එක වළක්වන්න
        if (totalCredits === 0) return "0.00"; 
        
        return (totalPoints / totalCredits).toFixed(2); // දශම ස්ථාන 2කට හදනවා
    };
```

## 3. React වල තියෙන මැජික් එක! (Auto Rendering)

ඔයා මේ Calculator එක පාවිච්චි කරද්දී, ඔයා "A" කියන එක "B" කියලා වෙනස් කරපු ගමන්ම (බොත්තමක් ඔබන්නේ නැතුවම) යටින් තියෙන GPA අගය (උදා: 3.5 ඉඳන් 3.2 වගේ) ඉබේම වෙනස් වෙනවා. 

**මේක වෙන්නේ කොහොමද?**
අපි අර මුලින්ම හැදුවා නේද `courses` කියලා `useState` එකක්? React වල නීතියක් තියෙනවා: **"`useState` එකේ තියෙන දෙයක් වෙනස් වුණු ගමන්, මුළු තිරයම (Component එකම) මුල ඉඳන් ආයෙත් අඳිනවා"** කියලා.

ඉතින් ඔයා විෂයක Grade එකක් වෙනස් කරපු ගමන්, අර `courses` පෙට්ටියේ අගය වෙනස් වෙනවා. එතකොට React එකෙන් මුළු පිටුවම ආයෙ අඳිනවා. එහෙම අඳිද්දී අර `calculateGPA()` කියන ගණන් හදන Function එක ආයෙත් වැඩ කරලා අලුත්ම උත්තරේ යටින් පෙන්නනවා. 

```tsx
    return (
        <div>
            <h1>GPA Calculator</h1>
            
            {/* මෙතන තමයි GPA උත්තරේ පෙන්වන්නේ */}
            <h2 className="text-4xl text-blue-600">
                Total GPA: {calculateGPA()}
            </h2>
            
            <button onClick={addCourse}>අලුත් විෂයක් එකතු කරන්න</button>
        </div>
    );
}
```

> **සාරාංශය:**
> * මේ Feature එකේදී දත්ත සේව් කරන්න Database එකක් (PHP) ඕනේ නැහැ. ඔක්කොම මතක තියාගන්නේ බ්‍රව්සර් එක ඇතුළේ (RAM එකේ).
> * ඒක කරන්නේ React **`useState`** පාවිච්චි කරලයි.
> * `useState` එකේ තියෙන දෙයක් වෙනස් වුණු ගමන් React විසින් ඉබේම මුළු තිරයම අලුත් කරන (Render කරන) නිසා, ගණනය කිරීම් බොත්තමක් නොඔබම ක්ෂණිකව වෙනස් වෙනවා පේනවා.

දැන් ඔයා දන්නවා Database එකක් නැතුවත් ලස්සන දේවල් React වලින් විතරක් හදන්න පුළුවන් කියලා. 

ඊළඟ පාඩමෙන් අපි බලමු කැම්පස් එක ගැන විස්තර තියෙන **Info Hub** එක කොහොමද හදලා තියෙන්නේ කියලා. (මේකෙදි අපි Markdown පාවිච්චි කරන හැටි ඉගෙන ගන්නවා).
