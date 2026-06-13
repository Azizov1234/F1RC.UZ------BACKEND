import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUser } from "../types/auth.user.type";

export const CurrentUser= createParamDecorator(
    (data:keyof AuthUser | undefined , ctx: ExecutionContext)=>{
        const request= ctx.switchToHttp().getRequest<{
            user?: AuthUser
        }>();
        const user= request.user

        if(data){
            return user?.[data]
        }
        return user
    }
)