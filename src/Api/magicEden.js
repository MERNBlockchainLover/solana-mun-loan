import nft1 from '../Utility/test/nft1.json';
import nft2 from '../Utility/test/nft2.json';
import nft3 from '../Utility/test/nft3.json';

//const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const proxyUrl = '';

export const GetCollectionList = async () => {
	//https://stats-mainnet.magiceden.io/collection_stats/popular_collections/sol?limit=1000&window=1d

	const headers = {'Content-Type':'application/json',
                    'Access-Control-Allow-Origin':'*',
                    'Access-Control-Allow-Methods':'GET, POST, PUT, PATCH, POST, DELETE, OPTIONS'}

	return await fetch(proxyUrl + "https://api-mainnet.magiceden.dev/v2/collections?offset=0&limit=500", {method: "GET", headers: headers}).then(response => response.json())
	.catch(error => console.log(error));
}

export const getCollectionStats = async(collectionSymbol) => {
	const options = {method: 'GET', headers: {accept: 'application/json'}};

	return await fetch("https://api-mainnet.magiceden.dev/v2/collections/" + collectionSymbol + "/stats", options)
	.then(response => response.json())
	.catch(err => console.error(err));
}

export const getNFTInfoByMintAddress = async(mintAddress) => {
	// const options = {method: 'GET', headers: {accept: 'application/json'}};
	// return await fetch("https://api-mainnet.magiceden.dev/v2/tokens/" + mintAddress, options).then(res => res.json());
	
	if(Math.floor(Math.random() * 10) % 2 == 0)
		return nft1;
	else
		return nft2;
	throw new Error('Something went wrong');
}