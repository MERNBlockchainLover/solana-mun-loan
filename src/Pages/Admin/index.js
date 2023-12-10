import React, { useEffect, useState, useContext, CSSProperties } from "react";
import axios from 'axios';
import {
  useCSVReader,
  lightenDarkenColor,
  formatFileSize,
} from 'react-papaparse';
import { Box, IconButton, useMediaQuery, Switch } from "@mui/material";

import { MintPriceValue, ButtonText } from "../../Components";
import Container from "../Container";

import TextField from '@mui/material/TextField';

import DeleteIcon from '@mui/icons-material/Delete';

import { CollectionColorButton } from "../../Components";
import { AmountInput } from "../../Components";

import {
    Metaplex,
    bundlrStorage,
    walletAdapterIdentity,
    sol,
    getMerkleRoot
} from "@metaplex-foundation/js";

import {
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey, Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import DialogContext from "../../Contexts/dialogContext";

import IDL from '../../Utility/Idl/idl.json';

import { deriveSCAccountPDA, deriveConfigurationAccountPDA, derivePoolAccountPDA, deriveNFTAccountPDA, deriveOrderAccountPDA, deriveTaxAccountPDA } from '../../Utility/ts/helper';
import { isElementOfType } from "react-dom/test-utils";
import { getAddedCollectionsList, setCollectionsList } from "../../Api/fetch";

const GREY = '#CCC';
const GREY_LIGHT = 'rgba(255, 255, 255, 0.4)';
const DEFAULT_REMOVE_HOVER_COLOR = '#A01919';
const REMOVE_HOVER_COLOR_LIGHT = lightenDarkenColor(
  DEFAULT_REMOVE_HOVER_COLOR,
  40
);
const GREY_DIM = '#686868';

const styles = {
  zone: {
    alignItems: 'center',
    border: `2px dashed ${GREY}`,
    borderRadius: 20,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    padding: 20,
  },
  file: {
    background: 'linear-gradient(to bottom, #EEE, #DDD)',
    borderRadius: 20,
    display: 'flex',
    height: 120,
    width: 120,
    position: 'relative',
    zIndex: 10,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  info: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 10,
    paddingRight: 10,
  },
  size: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    marginBottom: '0.5em',
    justifyContent: 'center',
    display: 'flex',
  },
  name: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    fontSize: 12,
    marginBottom: '0.5em',
  },
  progressBar: {
    bottom: 14,
    position: 'absolute',
    width: '100%',
    paddingLeft: 10,
    paddingRight: 10,
  },
  zoneHover: {
    borderColor: GREY_DIM,
  },
  default: {
    borderColor: GREY,
  },
  remove: {
    height: 23,
    position: 'absolute',
    right: 6,
    top: 6,
    width: 23,
  },
};

const MUN_PROGRAM_ID = new anchor.web3.PublicKey(
    "HTHZhsB4gmyTbNnWGU7kC3hU1JP79YzedQuyUwfqRijy"
);

const SearchItem = ({item, onClick, onDelete}) => {
    return <Box className="bg-[#292C4E] rounded-[6px] p-[10px] flex cursor-pointer" onClick={() => onClick(item.collectionSymbol, item.image)}>
        <img className="mr-[15px] my-auto !h-[30px] !w-[30px] rounded-[10px]" src={item.image} alt={item.collectionSymbol} />
        <ButtonText className="!text-[#6B6B6B] my-auto mr-auto" >{item.collectionSymbol}</ButtonText>
    </Box>
}

const ListedItem = ({item, onDelete}) => {
    return <Box className="bg-[#292C4E] rounded-[6px] p-[10px] flex">
        <img className="mr-[15px] my-auto !h-[30px] !w-[30px] rounded-[10px]" src={item.collection_image_url} alt={item.collection_name} />
        <ButtonText className="!text-[#6B6B6B] my-auto mr-auto">{item.collection_name}</ButtonText>
        <IconButton className="!my-auto !text-[#EB5757]" onClick={() => onDelete(item.collection_name)}>
            <DeleteIcon/>
        </IconButton>
    </Box>
}

export default function Admin() {
    const isDesktop = useMediaQuery('(min-width:1024px)');
    const { CSVReader } = useCSVReader();
    const [zoneHover, setZoneHover] = useState(false);
    const [removeHoverColor, setRemoveHoverColor] = useState(
        DEFAULT_REMOVE_HOVER_COLOR
    );

    const [lowInterest, setLowInterest] = useState(0.3);
    const [midInterest, setMidInterest] = useState(0.5);
    const [highInterest, setHighInterest] = useState(0.7);

    const [tier1, setTier1] = useState(1);
    const [tier2, setTier2] = useState(0.75);
    const [tier3, setTier3] = useState(0.5);

    const [maxMunPool, setMaxMunPool] = useState(2000);
    const [maxUserPool, setMaxUserPool] = useState(1000);

    const [mintPrice, setMintPrice] = useState(1);
    const [mintOn, setMintOn] = useState(true);
    const [presaleAmount, setPresaleAmount] = useState(0);

    const [walletAddress, setWalletAddress] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState(0);
    const { connection } = useConnection();
    const wallet = useWallet();
    const walletModal = useWalletModal();

    const diagCtx = useContext(DialogContext);
    const [whiteList, setWhiteList] = useState([]);

    const [originalData, setOriginalData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);

    const [listedData, setListedData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCriteria, setFilterCriteria] = useState('');

    useEffect(() => {
        // Fetch your data from the API
        axios.get('https://stats-mainnet.magiceden.io/collection_stats/popular_collections/sol?limit=1000&window=1d&compressionMode=both')
        .then(response => {
            setOriginalData(response.data);
            setFilteredData(response.data);
        })
        .catch(error => console.error('Error fetching data:', error));

        getAddedCollectionsList().then((res) => {
            console.log(res);
            setListedData(res.data);
        }).catch((error) => {
        });
    }, []);

    useEffect(() => {
        // Apply search and filter when searchQuery or filterCriteria change
        const filteredResults = originalData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filterCriteria === '' || item.category === filterCriteria)
        );
        setFilteredData(filteredResults);
    }, [searchQuery, filterCriteria, originalData]);

    const removeListedData = (name) => {
        const updatedListedData = listedData.filter((item) => item.collection_name !== name);
        setListedData(updatedListedData);
    }

    const moveToListedData = (name, image) => {
        const isPresent = listedData.some((item) => item.collection_name === name);

        if(isPresent){
            diagCtx.showWarning(`${name} collection is already exist.`);
            return;
        }
        const newItem = { collection_name: name, collection_image_url: image };
        const updatedListedData = [...listedData, newItem];
        setListedData(updatedListedData);
    }

    const initialize = async() => {
        // --- getting collection image ---
        diagCtx.showLoading("Initializing setting variables...");
        {
            const connection = new Connection("https://tiniest-warmhearted-season.solana-mainnet.quiknode.pro/e93197fd4a798a275aef90af5802e6cfd91bc21e/");
            const metaplex = new Metaplex(connection)
            .use(walletAdapterIdentity(wallet))
            .use(bundlrStorage());

            const candyMachine = await metaplex
                .candyMachines()
                .findByAddress({ address: new PublicKey("HCCyuPHQ4c7SqR9MfW4McALKDc4RbeRVpqT8spJUCcrQ") });
    
                setMintPrice(Math.fround(candyMachine.candyGuard.guards.solPayment.amount.basisPoints / LAMPORTS_PER_SOL).toFixed(2));
        }
        const provider = new anchor.AnchorProvider(connection, wallet, {});
        anchor.setProvider(provider);

        const program = new Program(
            IDL,
            MUN_PROGRAM_ID,
            provider
        );

        try {
            const [configurationPubKey] = await deriveConfigurationAccountPDA(
                NATIVE_MINT,
                program.programId
            );

            console.log(configurationPubKey.toBase58());

            const configuration = await program.account.configuration.fetch(
                configurationPubKey
            );
            
            setLowInterest(configuration.interestLow.toNumber() / 100);
            setMidInterest(configuration.interestMiddle.toNumber() / 100);
            setHighInterest(configuration.interestHigh.toNumber() / 100);
            setTier1(configuration.tier1Tax.toNumber() / 100);
            setTier2(configuration.tier2Tax.toNumber() / 100);
            setTier3(configuration.tier3Tax.toNumber() / 100);

            setMaxMunPool(configuration.maxMunPoolCount.toNumber());
            setMaxUserPool(configuration.maxUserPoolCount.toNumber());

            setWithdrawAmount(await connection.getBalance(new PublicKey(configuration.munTaxVault.toBase58())));

            if(configuration.mintOn.toNumber() === 1)
                setMintOn(true);
            else    setMintOn(false);

            setPresaleAmount(configuration.presaleAmount.toNumber());
            setWalletAddress(configuration.withdrawTaxVault.toBase58());

        } catch(e){
            diagCtx.showError(e.message);
            diagCtx.hideLoading();
            return;
        }
        diagCtx.showSuccess("Successfully get variables from configuration");
        diagCtx.hideLoading();
    }

    const withdrawTax = async () => {
        if (!wallet.connected) {
            diagCtx.showError("You're not connected to wallet.");
            walletModal.setVisible(true);
            return;
        }

        if(diagCtx.isAdmin === false){
            diagCtx.showError("You're not allowed to withdraw funds from tax vault.");
            walletModal.setVisible(true);
            return;
        }

        diagCtx.showLoading("Withdrawing tax...");

        const provider = new anchor.AnchorProvider(connection, wallet, {});
        anchor.setProvider(provider);

        const program = new Program(
            IDL,
            MUN_PROGRAM_ID,
            provider
        );

        const [configurationPubKey] = await deriveConfigurationAccountPDA(
            NATIVE_MINT,
            program.programId
        );

        const [munTaxVault] = await deriveTaxAccountPDA(
            NATIVE_MINT,
            program.programId
        )

        console.log("mun tax vault:", munTaxVault.toBase58());

        let configuration = await program.account.configuration.fetch(
            configurationPubKey
        );

        try {
            await program.methods
            .withdrawTax()
            .accounts({
                signer: provider.wallet.publicKey,
                configuration: configurationPubKey,
                munSolMint: NATIVE_MINT,
                munTaxVault: munTaxVault,
                userSolVault : provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([])
            .rpc();
        } catch(e){
            diagCtx.showError(e.message);
            diagCtx.hideLoading();
            return;
        }
        diagCtx.showSuccess("Successfully withdraw from tax vault.");
        diagCtx.hideLoading();
    }

    const saveSettings = async() => {
        if (!wallet.connected) {
            diagCtx.showError("You're not connected to wallet.");
            walletModal.setVisible(true);
            return;
        }

        if(!(lowInterest >= 0 && lowInterest <= 1) || !(midInterest >= 0 && midInterest <= 1) || !(highInterest >= 0 && highInterest <= 1)){
            diagCtx.showError("Please input correct interest amount.");
            return;
        }

        if(!(presaleAmount >= 0 && presaleAmount <= 22222)){
            diagCtx.showError("Please input correct presale amount");
            return;
        }

        diagCtx.showLoading("Changing configuration settings...");

        const provider = new anchor.AnchorProvider(connection, wallet, {});
        anchor.setProvider(provider);

        const program = new Program(
            IDL,
            MUN_PROGRAM_ID,
            provider
        );

        const [munSolVault] = await deriveSCAccountPDA(
            NATIVE_MINT,
            program.programId
        );

        const [configurationPubKey] = await deriveConfigurationAccountPDA(
            NATIVE_MINT,
            program.programId
        );

        let configuration = await program.account.configuration.fetch(
            configurationPubKey
        );

        console.log(munSolVault.toBase58());
        console.log(configurationPubKey.toBase58());

        console.log(configuration);

        const metaplex = new Metaplex(connection)
        .use(walletAdapterIdentity(wallet))
        .use(bundlrStorage());

        diagCtx.showLoading("Changing configuration settings (collections list)...");
        try {
            await setCollectionsList(listedData);
            diagCtx.showSuccess("Collections list updated successfully");
        } catch(e){
            diagCtx.showError(e.message);
            diagCtx.hideLoading();
            return;
        }
        diagCtx.hideLoading();

        diagCtx.showLoading("Changing configuration settings (minting price)...");
        let candyMachine;
        try {
            candyMachine = await metaplex
            .candyMachines()
            .findByAddress({ address: new PublicKey("HCCyuPHQ4c7SqR9MfW4McALKDc4RbeRVpqT8spJUCcrQ") });
    
            console.log(candyMachine.itemsMinted.toString(10), candyMachine.itemsAvailable.toString(10));

            await metaplex.candyMachines().update({
                candyMachine,
                guards: {
                    allowList: {
                        merkleRoot: getMerkleRoot(whiteList),
                    },
                    botTax: { lamports: sol(0.01), lastInstruction: false },
                    solPayment: { 
                        amount: sol(mintPrice),
                        destination: metaplex.identity().publicKey, 
                    },
                },
            });
        } catch(e){
            diagCtx.showError(e.message);
            diagCtx.hideLoading();
            return;
        }

        diagCtx.showLoading("Changing configuration settings (others)...");
        try {
            await program.methods
            .changeConfiguration(
                new anchor.BN(parseInt(lowInterest * 100)),
                new anchor.BN(parseInt(midInterest * 100)),
                new anchor.BN(parseInt(highInterest * 100)),
                new anchor.BN(parseInt(tier1 * 100)),
                new anchor.BN(parseInt(tier2 * 100)),
                new anchor.BN(parseInt(tier3 * 100)),
                new anchor.BN(parseInt(maxMunPool)),
                new anchor.BN(parseInt(maxUserPool)),
                new anchor.BN(mintOn === true ? 1 : 0),
                new anchor.BN(presaleAmount),
            )
            .accounts({
                signer: provider.wallet.publicKey,
                configuration: configurationPubKey,
                munSolMint: NATIVE_MINT,
            })
            .signers([])
            .rpc();
        } catch(e){
            diagCtx.showError(e.message);
            diagCtx.hideLoading();
            return;
        }
        diagCtx.showSuccess("Successfully changed configuration settings.");
        diagCtx.hideLoading();
    }

    useEffect(() => {
        if(wallet?.connected && !wallet?.disconnecting && !wallet?.connecting){
            console.log("initializing");
            initialize();
        }
    }, [wallet])

    return <Container>
        <Box className="mt-[30px] mx-[20px] lg:mt-[30px] lg:mx-[120px] xl:mx-[240px] 2xl:mx-[360px]">
            <Box className="grid grid-cols-2 gap-x-[40px] gap-y-[30px]">
                <MintPriceValue className="text-center">Add collection</MintPriceValue>
                <MintPriceValue className="text-center">Collections listed</MintPriceValue>
                <Box className="bg-[#1B1E3D] rounded-[10px] h-[420px] flex flex-col">
                    <TextField 
                        fullWidth
                        placeholder="Search ..."
                        sx={{
                            "& .MuiInputBase-root": {
                                borderRadius: "10px",
                                border: "1px solid #454545",
                                outline: 0,
                                color: "#888888"
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                border: "0px !important"
                            }
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Box className="px-[40px] py-[20px] flex flex-col gap-[15px] h-full overflow-y-auto">
                        {
                            filteredData.map((item, key) => {
                                return <SearchItem item={item} key={key} onClick={(symbol, image) => moveToListedData(symbol, image)}/>
                            })
                        }
                    </Box>
                </Box>
                <Box className="bg-[#1B1E3D] rounded-[10px] h-[420px] px-[40px] py-[15px] flex flex-col gap-[15px] overflow-y-auto">
                    {listedData?.map((item, i) => {
                        return <ListedItem item={item} key={i} onDelete={(symbol) => removeListedData(symbol)}/>
                    })}
                </Box>
            </Box>
            <Box className="p-[90px]">
                <Box className="grid grid-cols-3 gap-[40px]">
                    <MintPriceValue className="text-center">set low daily interest</MintPriceValue>
                    <MintPriceValue className="text-center">set medium daily interest</MintPriceValue>
                    <MintPriceValue className="text-center">set high daily interest</MintPriceValue>
                    <AmountInput placeholder="Enter low interest amount..." className="p-[24px] w-[260px] text-center" value={lowInterest} onChange={(e) => setLowInterest(e.target.value)}/>
                    <AmountInput placeholder="Enter middle interest amount..." className="p-[24px] w-[260px] text-center" value={midInterest} onChange={(e) => setMidInterest(e.target.value)}/>
                    <AmountInput placeholder="Enter high interest amount..." className="p-[24px] w-[260px] text-center" value={highInterest} onChange={(e) => setHighInterest(e.target.value)}/>
                </Box>
                <Box className="pt-[80px] grid grid-cols-3 gap-[40px]">
                    <MintPriceValue className="text-center">base Tax</MintPriceValue>
                    <MintPriceValue className="text-center">Tier 2 Tax</MintPriceValue>
                    <MintPriceValue className="text-center">Tier 3 Tax</MintPriceValue>
                    <AmountInput placeholder="Enter base tax..." className="p-[24px] w-[260px] text-center" value={tier1} onChange={(e) => setTier1(e.target.value)}/>
                    <AmountInput placeholder="Enter Tier 2 tax..." className="p-[24px] w-[260px] text-center" value={tier2} onChange={(e) => setTier2(e.target.value)}/>
                    <AmountInput placeholder="Enter Tier 3 tax..." className="p-[24px] w-[260px] text-center" value={tier3} onChange={(e) => setTier3(e.target.value)}/>
                </Box>
                <Box className="pt-[80px] grid grid-cols-3 gap-[40px]">
                    <MintPriceValue className="text-center">Max total pool</MintPriceValue>
                    <MintPriceValue className="text-center">Max pool per user</MintPriceValue>
                    <Box/>
                    <AmountInput placeholder="Enter max total pool..." className="p-[24px] w-[260px] text-center" value={maxMunPool} onChange={(e) => setMaxMunPool(e.target.value)}/>
                    <AmountInput placeholder="Enter max pool per user..." className="p-[24px] w-[260px] text-center" value={maxUserPool} onChange={(e) => setMaxUserPool(e.target.value)}/>
                </Box>
                <Box className="pt-[80px] flex gap-[30px]">
                    <MintPriceValue className="my-auto w-[260px] text-center">change mint price</MintPriceValue>
                    <AmountInput placeholder="Enter mint price amount..." className="p-[24px] w-[260px] text-center" value={mintPrice} onChange={(e) => setMintPrice(e.target.value)}/>
                    <MintPriceValue className="my-auto">SOL</MintPriceValue>
                </Box>
                <Box className="pt-[80px] flex gap-[30px]">
                    <MintPriceValue className="my-auto w-[260px] text-center">mint off/on</MintPriceValue>
                    <Switch
                        checked={mintOn}
                        onChange={(e) => setMintOn(e.target.checked)} 
                        sx={{
                        "&.MuiSwitch-root": {
                            height: "32px",
                            padding: 0,
                            borderRadius: "16px"
                        },
                        "& .MuiButtonBase-root": {
                            height: "32px"
                        },
                        "& .MuiSwitch-thumb": {
                            color: "#E5E7F7"
                        },
                        "& .MuiSwitch-track": {
                            backgroundColor: "#1380e0 !important",
                            opacity: "1 !important"
                        },
                        "& .Mui-checked": {
                            "& .MuiSwitch-thumb": {
                                color: "#0c0f2a"
                            },
                        }
                    }}/>
                </Box>
                <Box className="pt-[80px] flex gap-[30px]">
                    <MintPriceValue className="my-auto w-[260px] text-center">mint limit</MintPriceValue>
                    <AmountInput placeholder="Enter presale amount..." className="p-[24px] w-[260px] text-center" value={presaleAmount} onChange={(e) => setPresaleAmount(parseInt(e.target.value))}/>
                    <MintPriceValue className="my-auto"> / 22,222</MintPriceValue>
                </Box>
                <Box className="pt-[80px] flex gap-[30px]">
                    <CollectionColorButton className="my-auto !w-[260px]" onClick={() => withdrawTax()}>Withdraw {Math.fround(withdrawAmount / LAMPORTS_PER_SOL).toFixed(2)} SOL</CollectionColorButton>
                    <MintPriceValue className="my-auto w-[260px] text-center">Wallet:</MintPriceValue>
                    <MintPriceValue className="my-auto justify-center items-center"> {walletAddress} </MintPriceValue>
                </Box>
                <Box className="pt-[80px] flex gap-[30px]">
                    <MintPriceValue className="my-auto w-[260px] text-center">Update whitelists: </MintPriceValue>
                    <CSVReader
                        onUploadAccepted={(results) => {
                            const newArray = results?.data.map(item => item[0]);
                            setWhiteList(newArray);
                            console.log(newArray);
                            setZoneHover(false);
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setZoneHover(true);
                        }}
                        onDragLeave={(event) => {
                            event.preventDefault();
                            setZoneHover(false);
                        }}
                        >
                        {({
                            getRootProps,
                            acceptedFile,
                            ProgressBar,
                            getRemoveFileProps,
                            Remove,
                        }) => (
                            <>
                            <div
                                {...getRootProps()}
                                style={Object.assign(
                                {},
                                styles.zone,
                                zoneHover && styles.zoneHover
                                )}
                            >
                                {acceptedFile ? (
                                <>
                                    <div style={styles.file}>
                                    <div style={styles.info}>
                                        <span style={styles.size}>
                                        {formatFileSize(acceptedFile.size)}
                                        </span>
                                        <span style={styles.name}>{acceptedFile.name}</span>
                                    </div>
                                    <div style={styles.progressBar}>
                                        <ProgressBar />
                                    </div>
                                    <div
                                        {...getRemoveFileProps()}
                                        style={styles.remove}
                                        onMouseOver={(event) => {
                                        event.preventDefault();
                                        setRemoveHoverColor(REMOVE_HOVER_COLOR_LIGHT);
                                        }}
                                        onMouseOut={(event) => {
                                        event.preventDefault();
                                        setRemoveHoverColor(DEFAULT_REMOVE_HOVER_COLOR);
                                        }}
                                    >
                                        <Remove color={removeHoverColor} />
                                    </div>
                                    </div>
                                </>
                                ) : (
                                <p className="text-white">Drop CSV file here or click to upload</p>
                                )}
                            </div>
                            </>
                        )}
                    </CSVReader>
                </Box>
                <Box className="pt-[80px] flex justify-center items-center gap-[30px]">
                    <CollectionColorButton className="my-auto !w-[260px]" onClick={() => saveSettings()}>Save</CollectionColorButton>
                </Box>
            </Box>
        </Box>
    </Container>;
}