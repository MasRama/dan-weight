import DB from "../services/DB"
import bcrypt from "bcrypt";
import crypto from "crypto";
import { v4 as uuidv4 } from 'uuid';

class Controller {

  public async login(request, response) {
    const flash = request.session?.flash || {};
    return response.inertia("auth/login", { flash });
  }

  public async processLogin(request, response) {
    try {
      const body = await request.json();
      const { email, password } = body;
      
      const user = await DB.from('users')
          .where('email', email)
          .first();

      if (!user || !await bcrypt.compare(password, user.password)) {
          return response.status(401).json({ 
              error: 'Invalid credentials' 
          });
      }

      // Delete existing sessions for this user
      await DB('sessions')
          .where('user_id', user.id)
          .delete();

      // Create new session
      const sessionId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await DB('sessions').insert({
          id: sessionId,
          user_id: user.id,
          token: uuidv4(),
          expires_at: expiresAt.toISOString()
      });

      response.cookie('auth_id', sessionId, {
          httpOnly: true,
          secure: process.env.DB_CONNECTION === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/'
      });

      return response.json({ 
          message: 'Login successful'
      });
    } catch (error) {
        console.log(error);
        return response.status(500).json({ 
            error: 'Server error' 
        });
    }
  }

  public async logout(request, response) {
    
  }

  public async register(request, response) {
    if (request.method === "GET") {
      return response.inertia("auth/register");
    }

    try {
      const body = await request.json();
      const { name, email, password } = body;

      const existingUser = await DB("users")
        .where("email", email)
        .first();

      if (existingUser) {
        return response.json({
          message: "Email is already registered"
        }, 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const apiKey = crypto.randomBytes(32).toString('hex');

      await DB("users").insert({
        nama: name,
        email: email,
        password: hashedPassword,
        api_key: apiKey
      });
    
      return response.json({
        message: "Registration successful"
      }, 200);

    } catch (error) {
      console.error(error);
      return response.json({
        message: "Server error occurred"
      }, 500);
    }
  }
    
  public async show(request, response) {
   
  }

  public async edit(request, response) {
    
  }

  public async update(request, response) {
    
  }

  public async destroy(request, response) {

  }

}

export default new Controller();
