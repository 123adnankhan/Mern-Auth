import axios from "axios";
import { useEffect } from "react";
import { createContext, useState } from "react";
import {toast} from 'react-toastify'

export const AppContext = createContext();

export const AppContextprovider = (props)=>{
    axios.defaults.withCredentials =true;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [isLoggedIn,setIsLoggedIn]=useState(false);
    const [userData,setUserData] =useState(false);

    const getAuthState = async ()=>{
        try{
            const {data} = await axios.get(backendUrl +'/api/auth/is-auth');
            if(data.success){
                setIsLoggedIn(true);
                getUserData();
            }else{
                toast.error(data.message)
            }
        }catch(error){
            toast.error(error.message)
        }
    }
    const getUserData = async ()=>{
        try{
            const {data} = await axios.get(backendUrl +'/api/user/data')
            if(data.success){
                setUserData(data.userData);
            }else{
                toast.error(data.message)
            }
        }catch(error){
            toast.error(error.message)
        }
    }
    useEffect(()=>{
        getAuthState()
    },[])
    const value = {
        backendUrl,
        isLoggedIn,setIsLoggedIn,
        userData,setUserData,
        getUserData
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}