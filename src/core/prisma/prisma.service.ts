import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
 import { Logger } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from '@prisma/client';

import {Pool} from "pg"
 @Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit,OnModuleDestroy{
    constructor(){
        console.log(process.env.DATABASE_URL,"helloo");
        
        const connectionString= process.env.DATABASE_URL
        
        
        const pool= new Pool({connectionString});
        const adapter= new PrismaPg(pool)
        super({
            adapter,
            log:["error","warn"]
        })
    }

    async onModuleInit() {
        await this.$connect()
        Logger.log("Prisma is connected ✅")
    }
    async onModuleDestroy() {
        await this.$disconnect()
        Logger.log("Prisma is disconnected ❌")

    }
}
