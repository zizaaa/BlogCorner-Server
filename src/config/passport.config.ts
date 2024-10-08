import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import client from './db.config';
import { filteredResultTypes } from '../types/user';
require('dotenv').config();

const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET as string, 
};

passport.use(
    new JwtStrategy(options, async (jwt_payload, done) => {
        try {
            const query = 'SELECT * FROM users WHERE id = $1';
            const result = await client.query(query, [jwt_payload.id]);

            const filteredResult:filteredResultTypes = {
                id:result.rows[0].id,
                username:result.rows[0].username,
                name:result.rows[0].name,
                email:result.rows[0].email,
                avatar:result.rows[0].avatar,
                isverified:result.rows[0].isverified,
            }
            
            if (result.rows.length > 0) {
                return done(null, filteredResult);
            } else {
                console.log('Unauthorized')
                return done(null, false);
            }
        } catch (error) {
            console.log('Unauthorized')
            return done(error, false);
        }
    })
);

export default passport;