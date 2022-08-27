import './App.css';
import {useEffect, useState} from 'react'
import * as anchor from "@project-serum/anchor";
import {Buffer} from 'buffer';
import idl from './idl.json'
import { Connection, PublicKey, clusterApiUrl  } from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils } from '@project-serum/anchor';
import { FeedPostDesign } from './feedPostDesign';

const {SystemProgram,Keypair} = web3;

window.Buffer = Buffer
const programID = new PublicKey(idl.metadata.address)
const network = clusterApiUrl("devnet")
const opts = {
  preflightCommitment:"processed",
}
const feedPostApp = Keypair.generate();
const connection = new Connection(network, opts.preflightCommitment);


const App = () => {
  const [Loading, setLoading] = useState(false)
  const [datas,setData] = useState([])
  const [walletaddress, setWalletAddress] = useState("");
  
  const { solana } = window;
  const getProvider = () => {
    //Creating a provider, the provider is authenication connection to solana
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const checkIfWalletIsConnected = async () => {
    try {
      setLoading(true)
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          const response = await solana.connect({
            onlyIfTrusted: true, 
          });
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found!, Get a Phantom Wallet");
      }
    } catch (error) {
      console.log(error.message);
    }finally{
      setLoading(false)
    }
  };

  useEffect(() => {
    try{
      setLoading(true)
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }catch(err){
      console.log(err.message)
    }finally{
      setLoading(false)
    }
  }, []);

  const onLoad = async() => {
    await checkIfWalletIsConnected();
    await getPosts();
  };

  const connectWalletRenderPopup = async () => { // connecting to wallet this function will activate
    try{
      setLoading(true)
      if (solana) {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
      }
    }catch(err){
      console.log(err.message)
    }finally{
      setLoading(false)
    }
  };

  const connect = () => {
    return (
      <button onClick={connectWalletRenderPopup} className="buttonStyle"> {Loading ? <p>loading...</p>: <p>Connect Your Wallet To Post </p>}    </button>
    );
  };

  const createPostFunction = async(text,hastag,position) =>{ 
    const provider = getProvider() 
    const program = new Program(idl,programID,provider) 
    const num = new anchor.BN(position); 
    try{
      setLoading(true)
      const tx = await program.rpc.createPost(text,hastag,num,false,{ 
        accounts:{
          feedPostApp:feedPostApp.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers:[feedPostApp] 
      })
        onLoad();
    }catch(err){
      console.log(err.message)
    }finally{
      setLoading(false)
    }
  }

  const getPosts = async() =>{
    const provider = getProvider();
    const program = new Program(idl,programID,provider)
    try{
      setLoading(true)
      await Promise.all(
        ((await connection.getProgramAccounts(programID)).map(async(tx,index)=>( 
          {
          ...(await program.account.feedPostApp.fetch(tx.pubkey)),
            pubkey:tx.pubkey.toString(),
        }
        )))
    ).then(result=>{
      result.sort(function(a,b){return b.position.words[0] - a.position.words[0] })
      setData([...result])
    })
    }catch(err){
      console.log(err.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className='App'>
      <FeedPostDesign posts={datas} createPostFunction={createPostFunction}  walletaddress={walletaddress} connect={connect} Loading={Loading} />
    </div>
  );
};

export default App;
