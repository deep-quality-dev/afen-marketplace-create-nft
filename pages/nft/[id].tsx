import React from "react";
import Image from "next/image";
import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import Title from "../../components/IO/Title";
import Typography from "../../components/IO/Typography";
import Flex from "../../components/Layout/Flex";
import { api } from "../../utils/axios";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import moment from "moment";
import { BsArrowUpRight } from "react-icons/bs";
import {
  NFT,
  NFTStatusEnum,
  NFTTransaction,
  NFTTransactionEnum,
} from "../../types/NFT";
import Button from "../../components/IO/Button";
import useUser from "../../hooks/useUser";
import useContract from "../../hooks/useContract";
import useAuth from "../../hooks/useAuth";
import useNotifier from "../../hooks/useNotifier";
import { messages } from "../../constants/messages";
import { mintNFT } from "../../components/NFT/utils";
import { Nft } from "../../contracts/types";
import { NFT_ABI } from "../../contracts/abis/Nft";
import UserAvatar from "../../components/User/UserAvatar";
import { ContractTransaction } from "ethers";
import { createTransaction, updateNFT } from "../../components/NFT/apis";
import { logout } from "../../components/Auth/apis/auth";

interface NFTPageProps {
  nft: NFT;
  transactions: NFTTransaction[];
}

// getStaticPaths
export const getStaticPaths: GetStaticPaths = async () => {
  const response = await api.post("/nft/list", {
    pageNo: 1,
    numPerPage: 5000,
    filter: {
      isAuction: false,
      price: "",
    },
  });

  const NFTs: NFT[] = response?.data.list || [];

  const paths = NFTs.map(({ _id }) => ({
    params: {
      id: _id,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }: any) => {
  const { id } = params;

  try {
    const response = await api.get(`nft/${id}`);
    const nft: NFT = response.data.nft;
    if (nft) {
      const transactionsResponse = await api.post("/transaction/list", {
        pageNo: 1,
        numPerPage: 10,
        filter: {
          _id: nft._id,
        },
      });

      let transactions = transactionsResponse?.data.list || [];

      return { props: { nft, transactions }, revalidate: 1 };
    } else {
      return { notFound: true };
    }
  } catch (err) {
    return { notFound: true };
  }
};

export default function Token({ nft, transactions }: NFTPageProps) {
  const { isFallback } = useRouter();
  const [tabIndex, setTabIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [minting, setMinting] = React.useState(false);

  const { user, connectWallet } = useUser();
  const { authToken, isAuthenticated, toggleLoginDialog } = useAuth();
  const { setAbi, contractSigned } = useContract();
  const { notify } = useNotifier();

  const tabs = ["Description", "Transaction", "Details"];
  const isOwner = isAuthenticated && user?.user?._id === nft?.user?._id;
  const canSell = nft?.status === NFTStatusEnum.MINTED && nft?.canSell;

  React.useEffect(() => {
    setAbi(NFT_ABI);
  }, []);

  const getPrice = () => {
    let price = {
      currency: "AFEN",
      amount: nft?.afenPrice,
    };

    if (nft?.afenPrice === 0) {
      price = {
        currency: "BNB",
        amount: nft.bnbPrice,
      };
    }

    return price;
  };

  const tokenId = getPrice().currency === "AFEN" ? 0 : 1;

  const userCheck = () => {
    if (!isAuthenticated) {
      return toggleLoginDialog(true);
    }

    if (!user.address) {
      return notify({
        ...messages.connectWallet,
        action: {
          text: "Connect Wallet",
          onClick: connectWallet,
        },
      });
    }
  };

  const onBuyNFT = async () => {
    userCheck();
    notify({
      title: `Buy "${nft.title}"`,
      text: "You are about to buy this NFT, click continue to proceed",
      action: {
        text: "Continue",
        onClick: handleBuyNFT,
      },
    });
  };

  const handleBuyNFT = async () => {
    setLoading(true);

    try {
      const nftContract = contractSigned as Nft;
      await nftContract.setApprovalForAll(user.address, true, {
        from: nft.user._id,
      });
      await nftContract.buy(nft.user._id, nft.nftId, 10, tokenId, {
        from: user.address,
      });

      // update nft transaction

      notify({
        status: "success",
        title: `"${nft.title}" It's yours!`,
        text: "Check your wallet, you should find it",
        action: {
          onClick: undefined,
          text: "View",
        },
      });
    } catch (err) {
      setLoading(false);
      // catch error cases
      // - insufficient funds
      // - wrong network
      // - request cancelled
      return notify({
        ...messages.transactionError,
        action: {
          text: "Retry",
          onClick: onBuyNFT,
        },
      });
    }
    setLoading(false);
  };

  const onMintNFT = () => {
    // userCheck();
    notify({
      title: `Sell "${nft?.title}"`,
      text: "You're about to list this NFT for sale on the Marketplace, click Continue to proceed",
      action: {
        onClick: () => handleMintNFT(),
        text: "Continue",
      },
    });
  };

  const handleMintSuccess = (mint: ContractTransaction) => {
    createTransaction(
      {
        userId: user?.user._id,
        type: NFTTransactionEnum.MINT,
        nftId: nft?._id,
        price: getPrice().amount,
      },
      authToken
    )
      .then(() => notify(messages.minted))
      .catch((err) => {
        if (err?.response?.status === 401) {
          logout();
          notify(messages.sessionExpired);
        }
        notify(messages.somethingWentWrong);
      });

    updateNFT({
      _id: nft?._id,
      nftId: nft?.nftId,
      canSell: true,
      status: NFTStatusEnum.MINTED,
    }).catch((err) => {
      if (err?.response?.status === 401) {
        logout();
        notify(messages.sessionExpired);
      }
      notify(messages.somethingWentWrong);
    });
  };

  const handleMintNFT = async () => {
    const nftContract = contractSigned as Nft;
    setMinting(true);

    await mintNFT(
      nft.nftId,
      getPrice().amount,
      getPrice().currency === "AFEN" ? 0 : 1,
      nftContract,
      handleMintSuccess,
      () => {
        notify(messages.somethingWentWrong);
      }
    );

    setMinting(false);
  };

  return isFallback ? (
    <div></div>
  ) : (
    <div className="w-screen md:h-screen overflow-hidden">
      <div className="flex flex-wrap lg:flex-nowrap justify-between">
        <div className="mb-5 lg:mb-0 w-full mt-10 py-10 md:mt-0 md:py-0 md:h-screen md:w-3/5 lg:w-4/6 pt-16 flex flex-col items-center justify-between bg-gray-100 dark:bg-gray-500">
          <div className="h-96 px-8 md:px-0 md:h-5/6 md:pt-10 w-full md:w-5/6 my-auto">
            <div className="relative h-full w-full">
              <Image
                loading="eager"
                priority={true}
                src={nft.path}
                layout="fill"
                className="overflow-hidden shadow-lg"
                objectFit="contain"
                objectPosition="fill"
              ></Image>
            </div>
          </div>
        </div>
        <div className="relative w-full mb-10 md:w-2/5 lg:w-2/6 sm:mt-16 md:mt-32 flex flex-col px-4 md:px-10 lg:px-16 mx-auto overflow-hidden">
          <Flex spaceBetween wrap style="items-start mb-4 flex-nowrap w-full">
            <div>
              <Title style="text-2xl md:text-3xl font-semibold">
                {nft?.title}
              </Title>
              {/* <Link href={`/user/${nft?.user._id}`}> */}
              <div className="flex items-end mt-1 cursor-pointer">
                <UserAvatar image={nft?.user.avatar} name={nft?.user.name} />
                <Typography sub bold truncate textWidth="w-40">
                  {nft?.user.name}
                </Typography>
              </div>
              {/* </Link> */}
            </div>
            <div className="mt-4">
              <Typography sub bold size="small" style="text-right">
                Price
              </Typography>
              <Typography style="text-xl md:text-3xl text-right" bold>
                {getPrice().amount || 0} {getPrice().currency}
              </Typography>
            </div>
          </Flex>
          <div className="mt-3">
            <Tabs
              selectedIndex={tabIndex}
              onSelect={(index) => setTabIndex(index)}
            >
              <TabList>
                {tabs.map((tab, tabListIndex) => (
                  <Tab
                    key={tabListIndex}
                    className={`list-none inline-block pr-5 pt-2 mr-2 rounded-t-lg cursor-pointer pb-1 transition-colors duration-75 ease-linear text-sm focus:outline-none font-bold ${
                      tabListIndex === tabIndex
                        ? "bg-afen-yellow"
                        : "text-gray-500"
                    }`}
                  >
                    {tab}
                  </Tab>
                ))}
              </TabList>

              <TabPanel>
                <Typography>{nft.description}</Typography>
                <div className="mt-8">
                  <a
                    href={`https://ipfs.io/ipfs/${nft.fileHash}`}
                    target="_blank"
                    className="underline pb-2"
                  >
                    <Typography bold style="inline-flex">
                      View on IPFS
                      <BsArrowUpRight className="ml-2 text-xl" />
                    </Typography>
                  </a>
                </div>
              </TabPanel>
              <TabPanel>
                <div>
                  {transactions?.length ? (
                    <div></div>
                  ) : (
                    <Typography sub bold size="small">
                      No transactions yet
                    </Typography>
                  )}
                </div>
              </TabPanel>
              <TabPanel>
                <div className="my-5">
                  <Typography size="x-small" sub bold>
                    Last update
                  </Typography>
                  <Typography>
                    {moment(nft.updatedAt).format("MMMM Do YYYY, h:mm:ss a")}
                  </Typography>
                </div>
                <div>
                  <Typography size="x-small" sub bold>
                    Created
                  </Typography>
                  <Typography>
                    {moment(nft.createdAt).format("MMMM Do YYYY, h:mm:ss a")}
                  </Typography>
                </div>
              </TabPanel>
            </Tabs>
          </div>
          <div className="mt-auto pt-12 md:pt-4">
            {/* <Typography bold style="text-blue-500">You own this NFT</Typography>
            <Message
              data={{ text: "You own this NFT" }}
              dismissable={false}
              style="mt-4"
            /> */}
            {isOwner ? (
              <>
                {nft?.status === NFTStatusEnum.CREATED && (
                  <>
                    <Button
                      block
                      type="outlined"
                      size="large"
                      style="mb-4"
                      onClick={onMintNFT}
                      loading={minting}
                    >
                      Sell
                    </Button>
                    <Typography sub size="x-small" style="text-center">
                      This would make your NFT available on the Marketplace
                    </Typography>
                  </>
                )}
                {nft?.status === NFTStatusEnum.MINTED && nft?.canSell && (
                  <>
                    <Button
                      block
                      type="delete"
                      size="large"
                      style="mb-4"
                      onClick={onBuyNFT}
                      loading={loading}
                      disabled={!canSell}
                    >
                      Remove from Marketplace
                    </Button>
                    <Typography sub size="x-small" style="text-center">
                      This would take your NFT off the Marketplace
                    </Typography>
                  </>
                )}
              </>
            ) : (
              <>
                <Button
                  block
                  size="large"
                  onClick={onBuyNFT}
                  loading={loading}
                  style="mb-4"
                  disabled={!canSell}
                >
                  Buy
                </Button>
                {!canSell && (
                  <Typography sub size="x-small" style="text-center">
                    This NFT is not available for sale
                  </Typography>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
