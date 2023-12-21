import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

type CreateUserProps = {
    name: string,
    discordId: string
}

export default async function createUser({name, discordId}: CreateUserProps) {
  const newUser = await prisma.user.create({
    data: {
      name,
      discordId
    },
  })
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  console.log("Created new user: ", newUser);
}