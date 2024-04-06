import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define an interface that extends the express Request interface
interface AuthenticatedRequest extends Request {
  user?: any; // or whatever type 'decoded' is
}

const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => { // Explicitly annotate that function returns void
  const token = req.headers['authorization'];

  if (!token) {
    res.status(401).json({ message: 'Access denied, token is required' });
  } else {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
      req.user = decoded;
      next();
    } catch (error) {
      res.status(403).json({ message: 'Invalid token' });
    }
  }
};

export default verifyToken;
