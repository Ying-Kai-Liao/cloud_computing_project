import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CreateRecordProps = {
    discordId: string;
    name?: string;
    gender?: string;
    birth?: string;
    abroadRecord?: boolean;
    birdRecord?: boolean;
    feverRecord?: boolean;
    education?: string;
    employment?: string;
    marriage?: string;
    living?: string;
    address?: string;
    alcoholFrequency?: string;
    smokingFrequency?: string;
    arriveTime?: string;
};

export default async function createRecord({
    discordId,
    name,
    gender,
    birth,
    abroadRecord,
    birdRecord,
    feverRecord,
    education,
    employment,
    marriage,
    living,
    address,
    alcoholFrequency,
    smokingFrequency,
    arriveTime,
}: CreateRecordProps) {

    const currentUser = await prisma.user.findUnique({
        where: {
            discordId: discordId,
        },
    });
    if (!currentUser) return

    const record = await prisma.record.findFirst({
        where: {
            userId: currentUser.id
        },
    });

    if (record) {
        const updatedRecord = await prisma.record.update({
            where: {
                id: record.id,
            },
            data: {
                name,
                gender,
                birth,
                abroadRecord,
                birdRecord,
                feverRecord,
                education,
                employment,
                marriage,
                living,
                address,
                alcoholFrequency,
                smokingFrequency,
            },
        });

        console.log("Updated Record: ", updatedRecord);

        return updatedRecord;
    }

    const newRecord = await prisma.record
        .create({
            data: {
                userId: currentUser?.id as string,
                name,
                gender,
                birth,
                abroadRecord,
                birdRecord,
                feverRecord,
                education,
                employment,
                marriage,
                living,
                address,
                alcoholFrequency,
                smokingFrequency,
                arriveTime,
            },
        })
        .catch((e) => {
            throw e;
        })
        .finally(async () => {
            await prisma.$disconnect();
        });

    console.log("Created new Record: ", newRecord);
    return newRecord;
}
