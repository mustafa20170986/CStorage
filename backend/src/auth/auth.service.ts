import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from 'src/db/drizzle';
import * as schema from '../db/schema';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { Usercredentials } from 'src/rustfs/dto/user';
import { userTable } from 'src/db/schema/user';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(DRIZZLE)
    private readonly drizzle: PostgresJsDatabase<typeof schema>,
  ) {}

  async generatetoken(userId: string, email: string) {
    const payload = { sub: userId, email };
    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_secret || 'access_token_secret',
      expiresIn: '15m',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_secret || 'refresh_token_secret',
      expiresIn: '7d',
    });
    const refresh_token_hashed = await bcrypt.hash(refresh_token, 10);

    await this.drizzle
      .update(schema.userTable)
      .set({ refresh_token: refresh_token_hashed })
      .where(eq(schema.userTable.id, userId));

    return { access_token, refresh_token };
  }

  async signup(dto: Usercredentials) {
    const existuser = await this.drizzle
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.email, dto.email));

    if (existuser.length > 0) {
      throw new Error('User with this email exists');
    }
    const hashpassword = await bcrypt.hash(dto.password, 10);

    const [creatuser] = await this.drizzle
      .insert(schema.userTable)
      .values({
        email: dto.email,
        password: hashpassword,
      })
      .returning();

    const token = await this.generatetoken(creatuser.id, creatuser.email);
    return {
      ...token,
      user: {
        id: creatuser.id,
        email: creatuser.email,
      },
    };
  }
  async validateuser(email: string, password: string) {
    const [user] = await this.drizzle
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.email, email));
    if (!user) return null;

    const matchpassword = await bcrypt.compare(password, user.password);
    if (!matchpassword) {
      throw new Error('wrong password check again');
    }
    const { password: userPassword, ...result } = user;
    return result;
  }
  async signin(user: any) {
    const token = await this.generatetoken(user.id, user.email);
    return {
      ...token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
  async refresh_token_rotation(userId: string, increfreshtoken: string) {
    const [user] = await this.drizzle
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.id, userId));
    if (!user || !user.refresh_token) {
      throw new Error(' user is suspecious');
    }
    //compare token
    const compare = await bcrypt.compare(increfreshtoken, user.refresh_token);
    if (!compare) {
      throw new Error('comparison failed');
    }
    const newtoken = await this.generatetoken(userId, user.email);

    return { ...newtoken };
  }
}
