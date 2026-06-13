import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { Observable } from "rxjs";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private readonly reflactor: Reflector) { }
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const roles =
            this.reflactor.getAllAndOverride<UserRole[]>("roles", [
                context.getHandler(),
                context.getClass()
            ]) ?? []
        if (roles.length === 0) {
            return true
        }
        if (!roles.includes(req.user.role)) throw new ForbiddenException();
        return true;
    }

}