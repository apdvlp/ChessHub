import {create} from 'zustand';

const useAuthStore = create((set)=>({
    user:null,
    login:(token)=>{
        localStorage.setItem('token',token);
        set({user:true});
    },
    logout:()=>{
        localStorage.removeItem('access');
        set({user:null});
    },
}));

export default useAuthStore;