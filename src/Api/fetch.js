import { location } from './config';
import axios from 'axios';

export const getUserPFP = async(wallet_addr) => {
//    return await fetch(`${location}/getPFP/wallet_addr=${wallet_addr}`, {method: "GET"}).then(res => res.json());
    try {
        const res = await axios.post(
        `${location}/getPFP`,
        {
            wallet_addr : wallet_addr
        }
        );
        return res.data;
    } catch (ex) {
        return ex;
    }
}

export const getAddedCollectionsList = async() => {
    const options = {method: 'GET', headers: {accept: 'application/json'}};
	return await fetch("https://mun.tools/api/collections_get_all.php", options).then(res => res.json());
}

export const setCollectionsList = async(listedData) => {
    const options = {method: 'POST', headers: {accept: 'application/json'}, body: JSON.stringify(listedData)};
    const response = await fetch("https://mun.tools/api/collections_set_all.php", options)
	const data = await response.json();

    if(data && data.error){
        throw new Error(`Server error : ${data.error}`);
    }

    return data;
}