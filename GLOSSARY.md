# Vandingo

An educational quiz app for a family: quizzes are written in an editor, played on a phone, and every practice leaves a result.

## Language

### Content

**Subject** (*Tantárgy*):
A category of learning material, such as history or English. It has a fixed key (`history`) and a display name (*Történelem*), and owns its own settings.
*Avoid*: Topic, course

**Quiz** (*Kvíz*):
A named set of questions within one subject, at one difficulty level; identified by its subject and difficulty.
*Avoid*: Test, lesson

**Difficulty** (*Nehézségi szint*):
A whole number from 1 to 20 that orders quizzes within a subject; each level holds at most one quiz.
*Avoid*: Level, grade

**Question** (*Kérdés*):
One item in a quiz, answered in the way its question type prescribes; the unit of scoring.
*Avoid*: Task, item, exercise

**Question type** (*Kvíztípus*):
How a question is answered: true–false, word-matching, multiple-choice or ordered. Set per question, never per quiz.
*Avoid*: Quiz type (as a property of a quiz)

**Playable type**:
A question type that a practice can currently present: true–false and word-matching. Questions of other types are kept but skipped.

### Playing

**Participant** (*Kitöltő*):
One of the fixed set of people who play quizzes: Janka, Vanda, Gréta, János.
*Avoid*: User, player, student

**Practice** (*Gyakorlás*):
One sitting in which a participant answers questions drawn, without repetition, from a subject's inclusive difficulty range, under one shared countdown.
*Avoid*: Session, attempt, run

**Block** (*Blokk*):
The group of same-type questions shown and scored together within a practice: three true–false statements or five word pairs.
*Avoid*: Page, round

**Result** (*Eredmény*):
The summary record of one finished practice: who, when, which range, how many correct, how much time.
*Avoid*: Score sheet, log

**Passed** (*Teljesített*):
A practice whose result is 100% correct.
