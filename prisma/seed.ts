import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create Admin
  const adminPassword = await hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Super Admin',
      password: adminPassword,
      role: 'ADMIN',
      wallet: { create: { balance: 0 } },
    },
  })
  console.log(`Created admin user with id: ${admin.id}`)

  // Create User
  const userPassword = await hash('user123', 10)
  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      name: 'Regular User',
      password: userPassword,
      role: 'USER',
      wallet: { create: { balance: 100000 } },
      healthProfile: {
        create: {
          weight: 65,
          height: 170,
          age: 21,
          gender: 'MALE',
          activityLevel: 'MODERATE',
          goal: 'MAINTAIN',
          bmr: 1619,
          tdee: 2509,
        }
      }
    },
  })
  console.log(`Created test user with id: ${user.id}`)

  // Create Canteens
  const canteenHC = await prisma.canteen.upsert({
    where: { id: 'canteen-hc' },
    update: {},
    create: {
      id: 'canteen-hc',
      name: 'Kantin Gedung Hendricus',
      building: 'HC',
      seatRows: 4,
      seatCols: 5,
    },
  })

  const canteenTA = await prisma.canteen.upsert({
    where: { id: 'canteen-ta' },
    update: {},
    create: {
      id: 'canteen-ta',
      name: 'Kantin Gedung Thomas Aquinas',
      building: 'TA',
      seatRows: 4,
      seatCols: 5,
    },
  })
  console.log('Created canteens')

  // Generate Seats for HC
  let seatCounter = 1;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      await prisma.seat.upsert({
        where: { canteenId_row_col: { canteenId: canteenHC.id, row, col } },
        update: {},
        create: {
          canteenId: canteenHC.id,
          seatNumber: seatCounter++,
          row,
          col,
        },
      })
    }
  }

  // Generate Seats for TA
  seatCounter = 1;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      await prisma.seat.upsert({
        where: { canteenId_row_col: { canteenId: canteenTA.id, row, col } },
        update: {},
        create: {
          canteenId: canteenTA.id,
          seatNumber: seatCounter++,
          row,
          col,
        },
      })
    }
  }
  console.log('Created seats')

  // Create Sellers for HC (2 sellers)
  const sellerHC1 = await prisma.seller.upsert({
    where: { id: 'hc-seller-1' },
    update: {},
    create: { id: 'hc-seller-1', canteenId: canteenHC.id, name: 'Soto Kudus Mbak Sri' },
  })
  const sellerHC2 = await prisma.seller.upsert({
    where: { id: 'hc-seller-2' },
    update: {},
    create: { id: 'hc-seller-2', canteenId: canteenHC.id, name: 'Ayam Geprek Nelongso' },
  })

  // Create Sellers for TA (6 sellers)
  const sellerTA1 = await prisma.seller.upsert({
    where: { id: 'ta-seller-1' },
    update: {},
    create: { id: 'ta-seller-1', canteenId: canteenTA.id, name: 'Nasi Goreng Mas Budi' },
  })
  const sellerTA2 = await prisma.seller.upsert({
    where: { id: 'ta-seller-2' },
    update: {},
    create: { id: 'ta-seller-2', canteenId: canteenTA.id, name: 'Penyetan Cak To' },
  })
  const sellerTA3 = await prisma.seller.upsert({
    where: { id: 'ta-seller-3' },
    update: {},
    create: { id: 'ta-seller-3', canteenId: canteenTA.id, name: 'Mie Ayam Jakarta' },
  })
  const sellerTA4 = await prisma.seller.upsert({
    where: { id: 'ta-seller-4' },
    update: {},
    create: { id: 'ta-seller-4', canteenId: canteenTA.id, name: 'Gado-Gado Bu Ning' },
  })
  const sellerTA5 = await prisma.seller.upsert({
    where: { id: 'ta-seller-5' },
    update: {},
    create: { id: 'ta-seller-5', canteenId: canteenTA.id, name: 'Kedai Jus Segar' },
  })
  const sellerTA6 = await prisma.seller.upsert({
    where: { id: 'ta-seller-6' },
    update: {},
    create: { id: 'ta-seller-6', canteenId: canteenTA.id, name: 'Warteg Bahagia' },
  })
  console.log('Created sellers')

  // Create sample menu items
  const menuData = [
    { sellerId: sellerHC1.id, name: 'Soto Ayam Kudus', price: 15000, category: 'Makanan Berat', calories: 350, protein: 20, carbs: 40, fat: 12, fiber: 2 },
    { sellerId: sellerHC1.id, name: 'Soto Daging', price: 18000, category: 'Makanan Berat', calories: 400, protein: 25, carbs: 40, fat: 15, fiber: 2 },
    { sellerId: sellerHC1.id, name: 'Es Teh Manis', price: 3000, category: 'Minuman', calories: 120, protein: 0, carbs: 30, fat: 0, fiber: 0 },
    
    { sellerId: sellerHC2.id, name: 'Ayam Geprek Biasa', price: 15000, category: 'Makanan Berat', calories: 500, protein: 25, carbs: 50, fat: 22, fiber: 3 },
    { sellerId: sellerHC2.id, name: 'Es Jeruk', price: 4000, category: 'Minuman', calories: 110, protein: 1, carbs: 28, fat: 0, fiber: 1 },

    { sellerId: sellerTA1.id, name: 'Nasi Goreng Ayam', price: 15000, category: 'Makanan Berat', calories: 600, protein: 15, carbs: 70, fat: 20, fiber: 3 },
    { sellerId: sellerTA1.id, name: 'Nasi Goreng Spesial', price: 18000, category: 'Makanan Berat', calories: 700, protein: 22, carbs: 70, fat: 25, fiber: 3 },
    
    { sellerId: sellerTA5.id, name: 'Jus Alpukat', price: 10000, category: 'Minuman', calories: 250, protein: 3, carbs: 20, fat: 18, fiber: 7 },
    { sellerId: sellerTA5.id, name: 'Jus Mangga', price: 10000, category: 'Minuman', calories: 150, protein: 1, carbs: 35, fat: 0, fiber: 3 },
    
    { sellerId: sellerTA4.id, name: 'Gado-Gado', price: 12000, category: 'Sayuran', calories: 350, protein: 15, carbs: 30, fat: 15, fiber: 8 },
  ]

  for (const item of menuData) {
    await prisma.menuItem.create({
      data: item
    })
  }
  console.log('Created menu items')
  
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
