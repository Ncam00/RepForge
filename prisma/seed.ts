import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { subDays, startOfDay, addMinutes } from 'date-fns'

const prisma = new PrismaClient()

function daysAgo(n: number): Date {
  return startOfDay(subDays(new Date(), n))
}

function jitter(base: number, range: number): number {
  return Math.round((base + (Math.random() - 0.5) * 2 * range) * 10) / 10
}

async function main() {
  console.log('🌱 Starting seed...')

  // ─────────── USER ───────────
  const hashedPassword = await hash('password123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@repforge.com' },
    update: {},
    create: {
      email: 'demo@repforge.com',
      name: 'Alex Demo',
      password: hashedPassword,
    },
  })
  console.log('✅ User:', user.email)

  // ─────────── USER SETTINGS ───────────
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      weightUnit: 'lbs',
      theme: 'light',
      notifications: true,
      restTimerSound: true,
      autoStartTimer: true,
    },
  })

  // ─────────── EXERCISES ───────────
  const exerciseData = [
    { id: 'bench-press',     name: 'Barbell Bench Press',    muscleGroups: ['chest','triceps','shoulders'],        equipment: 'Barbell',     difficulty: 'intermediate', category: 'compound',  instructions: 'Lie on bench, lower bar to chest, press up',          tips: 'Keep elbows at 45°, maintain arch' },
    { id: 'incline-db-press',name: 'Incline Dumbbell Press', muscleGroups: ['upper chest','triceps','shoulders'], equipment: 'Dumbbells',   difficulty: 'intermediate', category: 'compound',  instructions: 'Set bench to 30-45°, press dumbbells from chest up',   tips: 'Control the descent, squeeze at top' },
    { id: 'cable-fly',       name: 'Cable Chest Fly',        muscleGroups: ['chest'],                            equipment: 'Cable',       difficulty: 'beginner',     category: 'isolation', instructions: 'Stand between cables, bring hands together in arc',   tips: 'Keep slight elbow bend throughout' },
    { id: 'squat',           name: 'Barbell Back Squat',     muscleGroups: ['quads','glutes','hamstrings'],       equipment: 'Barbell',     difficulty: 'intermediate', category: 'compound',  instructions: 'Bar on traps, squat to parallel or below, drive up',  tips: 'Chest up, knees tracking toes' },
    { id: 'rdl',             name: 'Romanian Deadlift',      muscleGroups: ['hamstrings','glutes','back'],        equipment: 'Barbell',     difficulty: 'intermediate', category: 'compound',  instructions: 'Hinge at hips, lower bar to mid-shin, return',        tips: 'Soft knee bend, push hips back' },
    { id: 'leg-press',       name: 'Leg Press',              muscleGroups: ['quads','glutes'],                   equipment: 'Machine',     difficulty: 'beginner',     category: 'compound',  instructions: 'Feet shoulder-width on platform, push to extension',  tips: 'Do not lock knees fully, full ROM' },
    { id: 'leg-curl',        name: 'Lying Leg Curl',         muscleGroups: ['hamstrings'],                       equipment: 'Machine',     difficulty: 'beginner',     category: 'isolation', instructions: 'Lie face down, curl pad to glutes',                   tips: 'Pause at contraction, lower slowly' },
    { id: 'deadlift',        name: 'Barbell Deadlift',       muscleGroups: ['back','glutes','hamstrings','traps'],equipment: 'Barbell',     difficulty: 'advanced',     category: 'compound',  instructions: 'Grip bar, flat back, lift with legs and hips',        tips: 'Engage lats, bar stays close to body' },
    { id: 'barbell-row',     name: 'Barbell Row',            muscleGroups: ['back','biceps','rear delts'],        equipment: 'Barbell',     difficulty: 'intermediate', category: 'compound',  instructions: 'Hinge 45°, row bar to lower chest',                   tips: 'Squeeze shoulder blades together' },
    { id: 'pull-ups',        name: 'Pull-ups',               muscleGroups: ['back','biceps'],                    equipment: 'Pull-up Bar', difficulty: 'intermediate', category: 'compound',  instructions: 'Hang from bar, pull chin over bar, lower controlled',  tips: 'Full hang at bottom, avoid kipping' },
    { id: 'lat-pulldown',    name: 'Lat Pulldown',           muscleGroups: ['back','biceps'],                    equipment: 'Cable',       difficulty: 'beginner',     category: 'compound',  instructions: 'Pull bar to upper chest, lean back slightly',         tips: 'Drive elbows down to hips' },
    { id: 'ohp',             name: 'Overhead Press',         muscleGroups: ['shoulders','triceps'],              equipment: 'Barbell',     difficulty: 'intermediate', category: 'compound',  instructions: 'Bar at shoulders, press overhead, lower controlled',   tips: 'Tuck ribs, tight core, full lockout' },
    { id: 'lateral-raise',   name: 'Dumbbell Lateral Raise', muscleGroups: ['lateral delts'],                    equipment: 'Dumbbells',   difficulty: 'beginner',     category: 'isolation', instructions: 'Raise dumbbells to shoulder height laterally',        tips: 'Slight forward lean, lead with elbows' },
    { id: 'face-pull',       name: 'Face Pull',              muscleGroups: ['rear delts','rotator cuff'],        equipment: 'Cable',       difficulty: 'beginner',     category: 'isolation', instructions: 'Pull rope to face, elbows high and wide',             tips: 'External rotate at end of movement' },
    { id: 'barbell-curl',    name: 'Barbell Curl',           muscleGroups: ['biceps'],                           equipment: 'Barbell',     difficulty: 'beginner',     category: 'isolation', instructions: 'Stand, curl bar from hip to shoulder',               tips: 'Keep elbows pinned to sides' },
    { id: 'tricep-pushdown', name: 'Tricep Rope Pushdown',   muscleGroups: ['triceps'],                          equipment: 'Cable',       difficulty: 'beginner',     category: 'isolation', instructions: 'Push rope down to hips, flare hands at bottom',      tips: 'Elbows tucked, squeeze at lockout' },
    { id: 'dips',            name: 'Dips',                   muscleGroups: ['chest','triceps','shoulders'],       equipment: 'Bodyweight',  difficulty: 'intermediate', category: 'compound',  instructions: 'Lower body between bars, press to full extension',     tips: 'Lean forward for chest, upright for triceps' },
    { id: 'plank',           name: 'Plank',                  muscleGroups: ['core','abs'],                       equipment: 'Bodyweight',  difficulty: 'beginner',     category: 'isolation', instructions: 'Hold position in push-up plank on forearms',          tips: 'Squeeze glutes, do not let hips sag' },
  ]

  for (const ex of exerciseData) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      update: {},
      create: {
        id: ex.id,
        name: ex.name,
        description: `${ex.category.charAt(0).toUpperCase() + ex.category.slice(1)} ${ex.muscleGroups[0]} exercise`,
        muscleGroups: JSON.stringify(ex.muscleGroups),
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        category: ex.category,
        instructions: ex.instructions,
        tips: ex.tips,
        isPublic: true,
      },
    })
  }
  console.log('✅ Exercises:', exerciseData.length)

  // ─────────── WORKOUT SPLIT ───────────
  const existingSplit = await prisma.workoutSplit.findFirst({ where: { userId: user.id, name: 'Push / Pull / Legs' } })
  if (!existingSplit) {
    const split = await prisma.workoutSplit.create({
      data: {
        userId: user.id,
        name: 'Push / Pull / Legs',
        description: '6-day PPL with progressive overload focus',
        isActive: true,
        days: {
          create: [
            { dayOfWeek: 1, name: 'Push A', description: 'Chest, shoulders, triceps', order: 0 },
            { dayOfWeek: 2, name: 'Pull A', description: 'Back, biceps',              order: 1 },
            { dayOfWeek: 3, name: 'Legs A', description: 'Quads, hamstrings, glutes', order: 2 },
            { dayOfWeek: 4, name: 'Push B', description: 'Chest, shoulders, triceps', order: 3 },
            { dayOfWeek: 5, name: 'Pull B', description: 'Back, biceps',              order: 4 },
            { dayOfWeek: 6, name: 'Legs B', description: 'Quads, hamstrings, glutes', order: 5 },
          ],
        },
      },
    })
    console.log('✅ Split:', split.name)
  }

  // ─────────── WORKOUT TEMPLATES ───────────
  const existingTemplate = await prisma.workoutTemplate.findFirst({ where: { userId: user.id } })
  if (!existingTemplate) {
    await prisma.workoutTemplate.create({
      data: {
        userId: user.id, name: 'Push Day — Strength',
        description: 'Heavy compound push movements with accessory work',
        isPublic: true, category: 'strength', difficulty: 'intermediate', duration: 70,
        exercises: { create: [
          { exerciseId: 'bench-press',     order: 0, sets: 4, reps: '4-6',  restTime: 180 },
          { exerciseId: 'ohp',             order: 1, sets: 4, reps: '5-8',  restTime: 150 },
          { exerciseId: 'incline-db-press',order: 2, sets: 3, reps: '8-12', restTime: 90  },
          { exerciseId: 'lateral-raise',   order: 3, sets: 4, reps: '12-15',restTime: 60  },
          { exerciseId: 'tricep-pushdown', order: 4, sets: 3, reps: '10-15',restTime: 60  },
        ]},
      },
    })
    await prisma.workoutTemplate.create({
      data: {
        userId: user.id, name: 'Pull Day — Strength',
        description: 'Deadlift-focused pull session with rows and curls',
        isPublic: true, category: 'strength', difficulty: 'intermediate', duration: 65,
        exercises: { create: [
          { exerciseId: 'deadlift',     order: 0, sets: 4, reps: '3-5',  restTime: 240 },
          { exerciseId: 'barbell-row',  order: 1, sets: 4, reps: '5-8',  restTime: 150 },
          { exerciseId: 'pull-ups',     order: 2, sets: 4, reps: '6-10', restTime: 90  },
          { exerciseId: 'lat-pulldown', order: 3, sets: 3, reps: '10-12',restTime: 90  },
          { exerciseId: 'barbell-curl', order: 4, sets: 3, reps: '10-12',restTime: 60  },
          { exerciseId: 'face-pull',    order: 5, sets: 3, reps: '15-20',restTime: 45  },
        ]},
      },
    })
    await prisma.workoutTemplate.create({
      data: {
        userId: user.id, name: 'Leg Day — Volume',
        description: 'High volume leg session targeting all muscle groups',
        isPublic: false, category: 'strength', difficulty: 'advanced', duration: 75,
        exercises: { create: [
          { exerciseId: 'squat',     order: 0, sets: 5, reps: '5',    restTime: 240 },
          { exerciseId: 'rdl',       order: 1, sets: 4, reps: '8-10', restTime: 120 },
          { exerciseId: 'leg-press', order: 2, sets: 4, reps: '10-15',restTime: 90  },
          { exerciseId: 'leg-curl',  order: 3, sets: 4, reps: '10-12',restTime: 75  },
        ]},
      },
    })
    console.log('✅ Templates: 3')
  }

  // ─────────── WEIGHT ENTRIES (60 days) ───────────
  const existingWeights = await prisma.weight.count({ where: { userId: user.id } })
  if (existingWeights === 0) {
    const weightEntries = []
    for (let i = 60; i >= 0; i--) {
      const trend = 186 - ((60 - i) / 60) * 7
      const noise = (Math.random() - 0.5) * 2.5
      weightEntries.push({
        userId: user.id,
        weight: Math.round((trend + noise) * 10) / 10,
        unit: 'lbs',
        bodyFat: i % 7 === 0 ? Math.round((19.5 - ((60 - i) / 60) * 2 + (Math.random() - 0.5)) * 10) / 10 : undefined,
        date: daysAgo(i),
      })
    }
    await prisma.weight.createMany({ data: weightEntries })
    console.log('✅ Weight entries:', weightEntries.length)
  }

  // ─────────── WEIGHT GOAL ───────────
  await prisma.weightGoal.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      startWeight: 186,
      targetWeight: 172,
      unit: 'lbs',
      targetDate: subDays(new Date(), -90),
      startDate: daysAgo(60),
      isActive: true,
    },
  })

  // ─────────── NUTRITION GOAL ───────────
  await prisma.nutritionGoal.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      calories: 2400,
      protein: 190,
      carbs: 250,
      fat: 75,
      fiber: 35,
    },
  })

  // ─────────── WORKOUT SESSIONS + SETS (60 days) ───────────
  const existingSessions = await prisma.workoutSession.count({ where: { userId: user.id } })
  if (existingSessions === 0) {
    type SessionPlan = { daysAgoN: number; type: 'push' | 'pull' | 'legs'; name: string }
    const schedule: SessionPlan[] = []
    const dayTypes: Array<'push' | 'pull' | 'legs'> = ['push', 'pull', 'legs', 'push', 'pull', 'legs']
    let typeIndex = 0

    for (let d = 59; d >= 0; d--) {
      const dow = daysAgo(d).getDay()
      if (dow === 0) continue
      if (Math.random() < 0.1) continue
      const t = dayTypes[typeIndex % 6]
      typeIndex++
      schedule.push({ daysAgoN: d, type: t, name: t === 'push' ? 'Push Day' : t === 'pull' ? 'Pull Day' : 'Leg Day' })
    }

    const totalSessions = schedule.length
    let sessIdx = 0

    for (const plan of schedule) {
      const progress = sessIdx / totalSessions
      const sessionStart = daysAgo(plan.daysAgoN)
      const duration = Math.floor(55 + Math.random() * 30)
      const sessionEnd = addMinutes(sessionStart, duration)
      sessIdx++

      const session = await prisma.workoutSession.create({
        data: {
          userId: user.id,
          name: plan.name,
          startedAt: sessionStart,
          completedAt: sessionEnd,
          duration,
          mood: ['good','great','average','good','great'][Math.floor(Math.random() * 5)],
          energyLevel: Math.floor(6 + Math.random() * 4),
        },
      })

      type SetRow = {
        workoutSessionId: string; exerciseId: string; setNumber: number
        weight: number | null; reps: number | null; rpe: number | null
        restTime: number | null; isWarmup: boolean; completedAt: Date
      }
      const sets: SetRow[] = []

      if (plan.type === 'push') {
        const benchTop = Math.round((175 + progress * 40) / 5) * 5
        sets.push({ workoutSessionId: session.id, exerciseId: 'bench-press', setNumber: 1, weight: benchTop * 0.5,  reps: 8, rpe: null, restTime: 60,  isWarmup: true,  completedAt: addMinutes(sessionStart, 3) })
        sets.push({ workoutSessionId: session.id, exerciseId: 'bench-press', setNumber: 2, weight: benchTop * 0.75, reps: 5, rpe: null, restTime: 90,  isWarmup: true,  completedAt: addMinutes(sessionStart, 7) })
        for (let s = 3; s <= 5; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'bench-press', setNumber: s, weight: benchTop, reps: jitter(5, 1), rpe: jitter(8, 0.5), restTime: 180, isWarmup: false, completedAt: addMinutes(sessionStart, 10 + s * 4) })
        }
        const ohpTop = Math.round((95 + progress * 30) / 5) * 5
        for (let s = 1; s <= 4; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'ohp', setNumber: s, weight: ohpTop, reps: jitter(6, 1), rpe: jitter(7.5, 0.5), restTime: 150, isWarmup: false, completedAt: addMinutes(sessionStart, 26 + s * 4) })
        }
        const incTop = Math.round((50 + progress * 20) / 5) * 5
        for (let s = 1; s <= 3; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'incline-db-press', setNumber: s, weight: incTop, reps: jitter(10, 1), rpe: jitter(7, 0.5), restTime: 90, isWarmup: false, completedAt: addMinutes(sessionStart, 45 + s * 3) })
        }
        const lrTop = Math.round((15 + progress * 10) / 5) * 5
        for (let s = 1; s <= 4; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'lateral-raise', setNumber: s, weight: lrTop, reps: jitter(14, 2), rpe: jitter(6.5, 0.5), restTime: 60, isWarmup: false, completedAt: addMinutes(sessionStart, 55 + s * 2) })
        }
        const tpTop = Math.round((50 + progress * 20) / 5) * 5
        for (let s = 1; s <= 3; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'tricep-pushdown', setNumber: s, weight: tpTop, reps: jitter(12, 2), rpe: jitter(7, 0.5), restTime: 60, isWarmup: false, completedAt: addMinutes(sessionStart, 64 + s * 2) })
        }
      }

      if (plan.type === 'pull') {
        const dlTop = Math.round((225 + progress * 70) / 5) * 5
        sets.push({ workoutSessionId: session.id, exerciseId: 'deadlift', setNumber: 1, weight: dlTop * 0.6, reps: 5, rpe: null, restTime: 90,  isWarmup: true,  completedAt: addMinutes(sessionStart, 5) })
        sets.push({ workoutSessionId: session.id, exerciseId: 'deadlift', setNumber: 2, weight: dlTop * 0.8, reps: 3, rpe: null, restTime: 120, isWarmup: true,  completedAt: addMinutes(sessionStart, 9) })
        for (let s = 3; s <= 5; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'deadlift', setNumber: s, weight: dlTop, reps: jitter(3, 1), rpe: jitter(8.5, 0.5), restTime: 240, isWarmup: false, completedAt: addMinutes(sessionStart, 14 + s * 5) })
        }
        const rowTop = Math.round((135 + progress * 40) / 5) * 5
        for (let s = 1; s <= 4; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'barbell-row', setNumber: s, weight: rowTop, reps: jitter(7, 1), rpe: jitter(7.5, 0.5), restTime: 150, isWarmup: false, completedAt: addMinutes(sessionStart, 35 + s * 4) })
        }
        for (let s = 1; s <= 4; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'pull-ups', setNumber: s, weight: null, reps: Math.max(3, Math.floor(progress * 4 + 5 + (Math.random() - 0.5) * 2)), rpe: jitter(7.5, 0.5), restTime: 120, isWarmup: false, completedAt: addMinutes(sessionStart, 52 + s * 3) })
        }
        const lpTop = Math.round((100 + progress * 40) / 10) * 10
        for (let s = 1; s <= 3; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'lat-pulldown', setNumber: s, weight: lpTop, reps: jitter(11, 1), rpe: jitter(7, 0.5), restTime: 90, isWarmup: false, completedAt: addMinutes(sessionStart, 65 + s * 3) })
        }
        const curlTop = Math.round((65 + progress * 25) / 5) * 5
        for (let s = 1; s <= 3; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'barbell-curl', setNumber: s, weight: curlTop, reps: jitter(10, 2), rpe: jitter(7, 0.5), restTime: 60, isWarmup: false, completedAt: addMinutes(sessionStart, 75 + s * 2) })
        }
      }

      if (plan.type === 'legs') {
        const sqTop = Math.round((185 + progress * 70) / 5) * 5
        sets.push({ workoutSessionId: session.id, exerciseId: 'squat', setNumber: 1, weight: sqTop * 0.5,  reps: 8, rpe: null, restTime: 90,  isWarmup: true,  completedAt: addMinutes(sessionStart, 5) })
        sets.push({ workoutSessionId: session.id, exerciseId: 'squat', setNumber: 2, weight: sqTop * 0.75, reps: 5, rpe: null, restTime: 120, isWarmup: true,  completedAt: addMinutes(sessionStart, 9) })
        for (let s = 3; s <= 7; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'squat', setNumber: s, weight: sqTop, reps: jitter(5, 0.5), rpe: jitter(8, 0.5), restTime: 240, isWarmup: false, completedAt: addMinutes(sessionStart, 14 + (s - 3) * 5) })
        }
        const rdlTop = Math.round((135 + progress * 60) / 5) * 5
        for (let s = 1; s <= 4; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'rdl', setNumber: s, weight: rdlTop, reps: jitter(9, 1), rpe: jitter(7.5, 0.5), restTime: 120, isWarmup: false, completedAt: addMinutes(sessionStart, 42 + s * 3) })
        }
        const lpressTop = Math.round((270 + progress * 90) / 10) * 10
        for (let s = 1; s <= 4; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'leg-press', setNumber: s, weight: lpressTop, reps: jitter(12, 2), rpe: jitter(7, 0.5), restTime: 90, isWarmup: false, completedAt: addMinutes(sessionStart, 56 + s * 3) })
        }
        const lcTop = Math.round((60 + progress * 40) / 5) * 5
        for (let s = 1; s <= 4; s++) {
          sets.push({ workoutSessionId: session.id, exerciseId: 'leg-curl', setNumber: s, weight: lcTop, reps: jitter(11, 1), rpe: jitter(7, 0.5), restTime: 75, isWarmup: false, completedAt: addMinutes(sessionStart, 69 + s * 2) })
        }
      }

      const cleanedSets = sets.map(s => ({
        ...s,
        weight: s.weight !== null ? Math.round(s.weight / 5) * 5 : null,
        reps: s.reps !== null ? Math.max(1, Math.round(s.reps)) : null,
        rpe: s.rpe !== null ? Math.round(s.rpe * 2) / 2 : null,
      }))
      await prisma.exerciseSet.createMany({ data: cleanedSets })
    }
    console.log('✅ Workout sessions:', schedule.length)
  }

  // ─────────── PERSONAL RECORDS ───────────
  const existingPRs = await prisma.personalRecord.count({ where: { userId: user.id } })
  if (existingPRs === 0) {
    await prisma.personalRecord.createMany({
      data: [
        { userId: user.id, exerciseId: 'bench-press', recordType: 'one_rep_max', value: 225,  date: daysAgo(3)  },
        { userId: user.id, exerciseId: 'bench-press', recordType: 'max_volume',  value: 4875, date: daysAgo(7)  },
        { userId: user.id, exerciseId: 'squat',       recordType: 'one_rep_max', value: 275,  date: daysAgo(2)  },
        { userId: user.id, exerciseId: 'squat',       recordType: 'max_volume',  value: 6875, date: daysAgo(9)  },
        { userId: user.id, exerciseId: 'deadlift',    recordType: 'one_rep_max', value: 315,  date: daysAgo(1)  },
        { userId: user.id, exerciseId: 'deadlift',    recordType: 'max_volume',  value: 3150, date: daysAgo(8)  },
        { userId: user.id, exerciseId: 'ohp',         recordType: 'one_rep_max', value: 135,  date: daysAgo(5)  },
        { userId: user.id, exerciseId: 'barbell-row', recordType: 'one_rep_max', value: 185,  date: daysAgo(4)  },
        { userId: user.id, exerciseId: 'pull-ups',    recordType: 'max_reps',    value: 15,   date: daysAgo(6)  },
      ],
    })
    console.log('✅ Personal records: 9')
  }

  // ─────────── JOURNAL ENTRIES ───────────
  const existingJournal = await prisma.journalEntry.count({ where: { userId: user.id } })
  if (existingJournal === 0) {
    await prisma.journalEntry.createMany({
      data: [
        { userId: user.id, date: daysAgo(1),  title: 'New deadlift PR!',             content: 'Hit 315 lbs today for the first time. Bar path was perfect. Rest time between sets was crucial.',                                                          mood: 'great', energyLevel: 9, sleepQuality: 8 },
        { userId: user.id, date: daysAgo(3),  title: 'Bench feeling strong',         content: 'Benched 225 lbs for 3 clean reps. Chest was sore from Monday but the warm-up fixed it. Volume is tracking well.',                                           mood: 'good',  energyLevel: 8, sleepQuality: 7 },
        { userId: user.id, date: daysAgo(6),  title: 'Tough leg day',                content: 'Squats were rough. Only got 3 reps on the last sets at 250. Diet has been off — need to eat more carbs before leg day.',                                     mood: 'okay',  energyLevel: 6, sleepQuality: 6 },
        { userId: user.id, date: daysAgo(9),  title: 'Pull day volume PR',           content: 'Rows and pull-ups felt amazing. Got 12 pull-ups on the first set — a new record. Chins are really coming along.',                                            mood: 'great', energyLevel: 8, sleepQuality: 8 },
        { userId: user.id, date: daysAgo(12), title: 'Deload week start',            content: 'Starting a deload. Reducing weights by 40%. Body needs it — elbows and knees have been achy.',                                                               mood: 'good',  energyLevel: 7, sleepQuality: 7 },
        { userId: user.id, date: daysAgo(16), title: 'Back from deload — fired up',  content: 'First session back. Everything felt explosive. Benched 220 for 5 which felt like nothing. Deloads are underrated.',                                          mood: 'great', energyLevel: 10,sleepQuality: 9 },
        { userId: user.id, date: daysAgo(20), title: 'OHP milestone — 125 lbs',      content: '125 lbs felt solid — lockout was crisp. Core bracing has improved massively since adding planks.',                                                           mood: 'good',  energyLevel: 8, sleepQuality: 7 },
        { userId: user.id, date: daysAgo(25), title: 'Motivation dip',               content: 'Struggled to get to the gym today. Work stress sapping energy. Got there eventually — just did the main lifts and left.',                                    mood: 'okay',  energyLevel: 4, sleepQuality: 5 },
        { userId: user.id, date: daysAgo(29), title: 'Squat form breakthrough',      content: "Widened stance 2 inches after watching form videos. Depth improved massively and knee pain is gone. Game changer.",                                          mood: 'great', energyLevel: 8, sleepQuality: 8 },
        { userId: user.id, date: daysAgo(35), title: 'Week 4 summary',               content: '4 sessions this week. Weight dropped 0.8 lbs. Calories averaged 2380. Feeling lean and strong at the same time.',                                           mood: 'good',  energyLevel: 7, sleepQuality: 7 },
        { userId: user.id, date: daysAgo(40), title: 'RDLs destroying hamstrings',   content: "Hamstrings wrecked after yesterday's RDLs. 175 lbs for 4x10 was a big jump. Will stay here until it feels easy.",                                           mood: 'good',  energyLevel: 7, sleepQuality: 8 },
        { userId: user.id, date: daysAgo(46), title: 'Starting the cut',             content: 'Starting a proper cut today at 186 lbs. Target is 172. Eating at ~400 calorie deficit, keeping protein at 190g.',                                           mood: 'good',  energyLevel: 7, sleepQuality: 7 },
        { userId: user.id, date: daysAgo(52), title: 'Pull-ups at 10 reps clean',    content: '10 clean pull-ups on the first set. 6 months ago I could barely do 3. Consistency really pays off.',                                                         mood: 'great', energyLevel: 9, sleepQuality: 9 },
        { userId: user.id, date: daysAgo(57), title: 'First session logged',         content: 'Logged my first session with RepForge. Really useful having everything in one place. Excited to watch the progress charts fill up.',                         mood: 'good',  energyLevel: 8, sleepQuality: 8 },
      ],
    })
    console.log('✅ Journal entries: 14')
  }

  // ─────────── NUTRITION ENTRIES (14 days) ───────────
  const existingNutrition = await prisma.nutritionEntry.count({ where: { userId: user.id } })
  if (existingNutrition === 0) {
    const meals = [
      { mealType: 'breakfast', foodName: 'Oats with Protein Powder',  servingSize: 100, calories: 420, protein: 35, carbs: 55, fat: 7,  fiber: 6 },
      { mealType: 'breakfast', foodName: 'Scrambled Eggs & Toast',    servingSize: 250, calories: 380, protein: 28, carbs: 30, fat: 16, fiber: 2 },
      { mealType: 'breakfast', foodName: 'Greek Yogurt Parfait',       servingSize: 300, calories: 340, protein: 30, carbs: 40, fat: 5,  fiber: 4 },
      { mealType: 'lunch',     foodName: 'Chicken Rice Bowl',         servingSize: 400, calories: 620, protein: 52, carbs: 65, fat: 14, fiber: 4 },
      { mealType: 'lunch',     foodName: 'Turkey Wrap',               servingSize: 350, calories: 550, protein: 44, carbs: 50, fat: 18, fiber: 5 },
      { mealType: 'lunch',     foodName: 'Tuna Salad Sandwich',       servingSize: 300, calories: 490, protein: 40, carbs: 42, fat: 16, fiber: 4 },
      { mealType: 'dinner',    foodName: 'Salmon & Sweet Potato',     servingSize: 450, calories: 680, protein: 55, carbs: 58, fat: 22, fiber: 7 },
      { mealType: 'dinner',    foodName: 'Beef Stir Fry & Rice',      servingSize: 500, calories: 720, protein: 58, carbs: 72, fat: 20, fiber: 5 },
      { mealType: 'dinner',    foodName: 'Chicken Breast & Veg',      servingSize: 420, calories: 560, protein: 60, carbs: 30, fat: 14, fiber: 8 },
      { mealType: 'snack',     foodName: 'Protein Shake',             servingSize: 300, calories: 180, protein: 25, carbs: 10, fat: 3,  fiber: 1 },
      { mealType: 'snack',     foodName: 'Almonds & Apple',           servingSize: 100, calories: 250, protein: 6,  carbs: 28, fat: 14, fiber: 4 },
      { mealType: 'snack',     foodName: 'Cottage Cheese',            servingSize: 150, calories: 160, protein: 22, carbs: 6,  fat: 4,  fiber: 0 },
    ]
    const nutritionEntries = []
    for (let d = 13; d >= 0; d--) {
      const day = daysAgo(d)
      for (const mealType of ['breakfast','lunch','dinner','snack'] as const) {
        const options = meals.filter(m => m.mealType === mealType)
        nutritionEntries.push({ userId: user.id, date: day, ...options[Math.floor(Math.random() * options.length)] })
      }
    }
    await prisma.nutritionEntry.createMany({ data: nutritionEntries })
    console.log('✅ Nutrition entries:', nutritionEntries.length)
  }

  // ─────────── ACHIEVEMENTS ───────────
  const existingAchievements = await prisma.achievement.count({ where: { userId: user.id } })
  if (existingAchievements === 0) {
    await prisma.achievement.createMany({
      data: [
        { userId: user.id, type: 'first_workout', title: 'First Rep',          description: 'Logged your very first workout',               icon: '🏋️', unlockedAt: daysAgo(57) },
        { userId: user.id, type: 'streak_7',      title: 'Week Warrior',       description: 'Maintained a 7-day workout streak',            icon: '🔥', unlockedAt: daysAgo(48) },
        { userId: user.id, type: '10_workouts',   title: 'Getting Consistent', description: 'Completed 10 workouts',                        icon: '💪', unlockedAt: daysAgo(45) },
        { userId: user.id, type: 'first_pr',      title: 'Personal Best',      description: 'Set your first personal record',               icon: '🏆', unlockedAt: daysAgo(40) },
        { userId: user.id, type: '25_workouts',   title: 'Habit Formed',       description: 'Completed 25 workouts',                        icon: '⚡', unlockedAt: daysAgo(25) },
        { userId: user.id, type: '100k_volume',   title: 'Volume Monster',     description: 'Lifted over 100,000 lbs total volume',         icon: '🦁', unlockedAt: daysAgo(18) },
        { userId: user.id, type: 'deadlift_2x',   title: 'Double Bodyweight',  description: 'Deadlifted 2x your bodyweight',                icon: '💯', unlockedAt: daysAgo(5)  },
        { userId: user.id, type: 'bench_200',     title: 'Bench Club',         description: 'Benched over 200 lbs for the first time',      icon: '🎯', unlockedAt: daysAgo(10) },
        { userId: user.id, type: '50_workouts',   title: 'Iron Devotion',      description: 'Completed 50 workouts',                        icon: '🛡️', unlockedAt: daysAgo(3)  },
      ],
    })
    console.log('✅ Achievements: 9')
  }

  // ─────────── USER PROGRESS / XP ───────────
  await prisma.userProgress.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      xp: 4850,
      level: 8,
      currentStreak: 5,
      longestStreak: 14,
      lastWorkoutDate: daysAgo(1),
      totalXpEarned: 4850,
    },
  })

  const existingXp = await prisma.xpTransaction.count({ where: { userId: user.id } })
  if (existingXp === 0) {
    const xpData = []
    for (let d = 55; d >= 0; d -= 2) {
      xpData.push({ userId: user.id, amount: 100, reason: 'Workout completed',    source: 'workout_complete', createdAt: daysAgo(d) })
      if (d % 10 === 0) xpData.push({ userId: user.id, amount: 50, reason: 'Personal record set', source: 'pr_set', createdAt: daysAgo(d) })
    }
    await prisma.xpTransaction.createMany({ data: xpData })
    console.log('✅ XP transactions:', xpData.length)
  }

  // ─────────── ACTIVE CHALLENGES ───────────
  const existingChallenges = await prisma.challenge.count({ where: { userId: user.id } })
  if (existingChallenges === 0) {
    await prisma.challenge.createMany({
      data: [
        { userId: user.id, type: 'weekly', title: 'Workout 4x This Week',    description: 'Hit 4 workouts before Sunday',          target: 4,     progress: 3,     xpReward: 200, status: 'active',    startDate: daysAgo(4), endDate: addMinutes(daysAgo(0), 60 * 24 * 3) },
        { userId: user.id, type: 'weekly', title: 'Log 5 Journal Entries',   description: 'Write 5 journal entries this week',     target: 5,     progress: 2,     xpReward: 150, status: 'active',    startDate: daysAgo(4), endDate: addMinutes(daysAgo(0), 60 * 24 * 3) },
        { userId: user.id, type: 'daily',  title: 'Hit Protein Goal Today',  description: 'Eat at least 190g of protein today',    target: 190,   progress: 142,   xpReward: 50,  status: 'active',    startDate: daysAgo(0), endDate: addMinutes(daysAgo(0), 60 * 24) },
        { userId: user.id, type: 'weekly', title: 'Volume Week: 30,000 lbs', description: 'Total weekly volume over 30k lbs',      target: 30000, progress: 22400, xpReward: 300, status: 'active',    startDate: daysAgo(4), endDate: addMinutes(daysAgo(0), 60 * 24 * 3) },
        { userId: user.id, type: 'weekly', title: 'Complete 5 Workouts',     description: 'Hit 5 workouts in a week',              target: 5,     progress: 5,     xpReward: 250, status: 'completed', startDate: daysAgo(11), endDate: daysAgo(5),  completedAt: daysAgo(6) },
        { userId: user.id, type: 'daily',  title: 'Morning Workout',         description: 'Complete a workout before 9am',         target: 1,     progress: 1,     xpReward: 100, status: 'completed', startDate: daysAgo(8),  endDate: daysAgo(7),  completedAt: daysAgo(7) },
      ],
    })
    console.log('✅ Challenges: 6')
  }

  console.log('\n🎉 Seed completed!')
  console.log('📧 Login: demo@repforge.com')
  console.log('🔑 Password: password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
