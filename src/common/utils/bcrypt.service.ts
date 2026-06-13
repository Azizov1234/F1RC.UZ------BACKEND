import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt"
@Injectable()
export class BcryptUtilsService {
    constructor(private readonly configService: ConfigService) { }

    async generateHashPass(password: string): Promise<string> {
        const saltRounds = this.configService.getOrThrow<number>("BCRYPT_SALT")
        return bcrypt.hash(password, +saltRounds)
    }
    async comparePasswords(password: string, hashPass: string): Promise<boolean> {
        return bcrypt.compare(password, hashPass);
    }
}