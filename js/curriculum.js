// curriculum.js — カリキュラムの入口（コース1〜4を束ねる）
// 各コースの実体は js/curriculum/ 配下。コンテンツを直すときはコースファイルだけ触る。
//
// データ型（全コース共通）:
//   Course:  { id, level:'L1'..'L4', name, tagline, weeks(目安), cert:{title}, chapters:[Chapter] }
//   Chapter: { id, no, title, goal, ready:bool, lessons:[Lesson] }
//   Lesson:  { id, type:'lecture'|'practice'|'submit', title, minutes,
//              body(講義HTML: .figure/.term-mock/.steps-fig/.compare/.callout が使える),
//              prompt(実習コピペ文・practice用),
//              verify({instruction,checks,passRule}・submit用),
//              quiz([{q,choices,answerIndex,explanation,backTo}]・submit用),
//              tips, videoSlot:bool }
//
// 章クリア = submitレッスンの「証拠合格 + ミニテスト合格」の両方。
// ready:false の章は「準備中」（地図と骨子だけ見せる）。

import { COURSE1 } from './curriculum/c1.js'
import { COURSE2 } from './curriculum/c2.js'
import { COURSE3 } from './curriculum/c3.js'
import { COURSE4 } from './curriculum/c4.js'

export const COURSES = [COURSE1, COURSE2, COURSE3, COURSE4]

export function findCourse(id) {
  return COURSES.find((c) => c.id === id) || null
}
export function findChapter(id) {
  for (const c of COURSES) {
    const ch = c.chapters.find((x) => x.id === id)
    if (ch) return { course: c, chapter: ch }
  }
  return null
}
export function findLesson(id) {
  for (const c of COURSES) {
    for (const ch of c.chapters) {
      const i = ch.lessons.findIndex((l) => l.id === id)
      if (i >= 0) return { course: c, chapter: ch, lesson: ch.lessons[i], index: i }
    }
  }
  return null
}
// 全章をコース横断の一直線に並べる（アンロック判定用）
export function chapterSequence() {
  const seq = []
  for (const c of COURSES) for (const ch of c.chapters) seq.push({ course: c, chapter: ch })
  return seq
}
