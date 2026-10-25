import { createContext } from 'react';
import type { AuthContextInterface } from '../interface';

const AuthContext = createContext<AuthContextInterface | undefined>(undefined);

export default AuthContext;
