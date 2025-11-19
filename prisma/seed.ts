import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create a demo user
  const hashedPassword = await hash('password123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@repforge.com' },
    update: {},
    create: {
      email: 'demo@repforge.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  })

  console.log('Created user:', user.email)

  // Create some exercises
  const exercises = [
    {
      name: 'Barbell Bench Press',
      description: 'Compound chest exercise',
      muscleGroups: JSON.stringify(['chest', 'triceps', 'shoulders']),
      equipment: 'Barbell',
      difficulty: 'intermediate',
      instructions: 'Lie on bench, lower bar to chest, press up',
      tips: 'Keep elbows at 45-degree angle, maintain arch',
      isPublic: true,
    },
    {
      name: 'Barbell Squat',
      description: 'Compound leg exercise',
      muscleGroups: JSON.stringify(['quads', 'glutes', 'hamstrings']),
      equipment: 'Barbell',
      difficulty: 'intermediate',
      instructions: 'Bar on shoulders, squat down, push through heels',
      tips: 'Keep chest up, knees track over toes',
      isPublic: true,
    },
    {
      name: 'Barbell Deadlift',
      description: 'Full body compound exercise',
      muscleGroups: JSON.stringify(['back', 'glutes', 'hamstrings', 'traps']),
      equipment: 'Barbell',
      difficulty: 'advanced',
      instructions: 'Grip bar, keep back straight, lift with legs and hips',
      tips: 'Engage lats, maintain neutral spine',
      isPublic: true,
    },
    {
      name: 'Pull-ups',
      description: 'Bodyweight back exercise',
      muscleGroups: JSON.stringify(['back', 'biceps']),
      equipment: 'Pull-up Bar',
      difficulty: 'intermediate',
      instructions: 'Hang from bar, pull chin over bar, lower controlled',
      tips: 'Full range of motion, avoid swinging',
      isPublic: true,
    },
    {
      name: 'Overhead Press',
      description: 'Shoulder compound exercise',
      muscleGroups: JSON.stringify(['shoulders', 'triceps']),
      equipment: 'Barbell',
      difficulty: 'intermediate',
      instructions: 'Bar at shoulders, press overhead, lower controlled',
      tips: 'Engage core, avoid excessive back arch',
      isPublic: true,
    },
  ]

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { id: exercise.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: exercise,
    })
  }

  console.log('Created exercises')

  // Create a sample workout split
  const split = await prisma.workoutSplit.create({
    data: {
      userId: user.id,
      name: 'Push Pull Legs',
      description: '3-day split focusing on movement patterns',
      isActive: true,
      days: {
        create: [
          {
            dayOfWeek: 1,
            name: 'Push Day',
            description: 'Chest, shoulders, triceps',
            order: 0,
          },
          {
            dayOfWeek: 3,
            name: 'Pull Day',
            description: 'Back, biceps',
            order: 1,
          },
          {
            dayOfWeek: 5,
            name: 'Leg Day',
            description: 'Quads, hamstrings, glutes',
            order: 2,
          },
        ],
      },
    },
  })

  console.log('Created workout split:', split.name)

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
