import { PrismaClient, Prisma } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.monthlySummary.deleteMany();
  await prisma.cashPayment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.month.deleteMany();
  await prisma.memberInvite.deleteMany();
  await prisma.messMember.deleteMany();
  await prisma.mess.deleteMany();
  await prisma.profile.deleteMany();

  const profiles = await Promise.all([
    prisma.profile.create({
      data: {
        userId: "seed_owner_naimur",
        name: "Naimur Reza",
        username: "naimur",
        email: "naimur@example.com",
        avatarUrl: null
      }
    }),
    prisma.profile.create({
      data: {
        userId: "seed_rahim",
        name: "Rahim Ahmed",
        username: "rahim",
        email: "rahim@example.com",
        avatarUrl: null
      }
    }),
    prisma.profile.create({
      data: {
        userId: "seed_karim",
        name: "Karim Hasan",
        username: "karim",
        email: "karim@example.com",
        avatarUrl: null
      }
    }),
    prisma.profile.create({
      data: {
        userId: "seed_hasan",
        name: "Hasan Mahmud",
        username: "hasan",
        email: "hasan@example.com",
        avatarUrl: null
      }
    })
  ]);

  const mess = await prisma.mess.create({
    data: {
      name: "Four Wild Duck",
      createdBy: profiles[0].userId
    }
  });

  const [owner, rahim, karim, hasan] = await Promise.all([
    prisma.messMember.create({
      data: {
        messId: mess.id,
        userId: profiles[0].userId,
        role: "OWNER",
        openingBalance: new Prisma.Decimal(2000),
        status: "ACTIVE"
      }
    }),
    prisma.messMember.create({
      data: {
        messId: mess.id,
        userId: profiles[1].userId,
        role: "MANAGER",
        openingBalance: new Prisma.Decimal(0),
        status: "ACTIVE"
      }
    }),
    prisma.messMember.create({
      data: {
        messId: mess.id,
        userId: profiles[2].userId,
        role: "MEMBER",
        openingBalance: new Prisma.Decimal(-500),
        status: "ACTIVE"
      }
    }),
    prisma.messMember.create({
      data: {
        messId: mess.id,
        userId: profiles[3].userId,
        role: "MEMBER",
        openingBalance: new Prisma.Decimal(1000),
        status: "ACTIVE"
      }
    })
  ]);

  const currentMonth = await prisma.month.create({
    data: {
      messId: mess.id,
      label: "May 2026",
      memberCount: 4,
      status: "OPEN"
    }
  });

  await prisma.expense.createMany({
    data: [
      {
        messId: mess.id,
        monthId: currentMonth.id,
        memberId: rahim.id,
        category: "RENT",
        amount: new Prisma.Decimal(4800),
        date: new Date("2026-05-01T00:00:00"),
        note: "House rent"
      },
      {
        messId: mess.id,
        monthId: currentMonth.id,
        memberId: owner.id,
        category: "BAZAR",
        amount: new Prisma.Decimal(2200),
        date: new Date("2026-05-03T00:00:00"),
        note: "Weekly bazar"
      },
      {
        messId: mess.id,
        monthId: currentMonth.id,
        memberId: karim.id,
        category: "INTERNET",
        amount: new Prisma.Decimal(1000),
        date: new Date("2026-05-05T00:00:00"),
        note: "Internet bill"
      },
      {
        messId: mess.id,
        monthId: currentMonth.id,
        memberId: hasan.id,
        category: "ELECTRICITY",
        amount: new Prisma.Decimal(850),
        date: new Date("2026-05-07T00:00:00"),
        note: "Electricity"
      },
      {
        messId: mess.id,
        monthId: currentMonth.id,
        memberId: owner.id,
        category: "BAZAR",
        amount: new Prisma.Decimal(1450),
        date: new Date("2026-05-10T00:00:00"),
        note: "Fish and groceries"
      }
    ]
  });

  await prisma.cashPayment.createMany({
    data: [
      {
        messId: mess.id,
        monthId: currentMonth.id,
        memberId: owner.id,
        amount: new Prisma.Decimal(4000),
        date: new Date("2026-05-04T00:00:00"),
        note: "Extra due payment"
      },
      {
        messId: mess.id,
        monthId: currentMonth.id,
        memberId: karim.id,
        amount: new Prisma.Decimal(2500),
        date: new Date("2026-05-06T00:00:00"),
        note: "Cash handover"
      },
      {
        messId: mess.id,
        monthId: currentMonth.id,
        memberId: hasan.id,
        amount: new Prisma.Decimal(3000),
        date: new Date("2026-05-08T00:00:00"),
        note: "Monthly contribution"
      }
    ]
  });

  await prisma.memberInvite.create({
    data: {
      messId: mess.id,
      email: "future-member@example.com",
      role: "MEMBER",
      openingBalance: new Prisma.Decimal(0),
      invitedBy: owner.userId
    }
  });

  console.log("Seed complete: Four Wild Duck demo data added.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
