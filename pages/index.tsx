import { useState } from "react";
import HomePage from "../components/Home";
import { fetchNFTs } from "../components/Home/apis";
import { NFT } from "../types/NFT";

const NUM_PER_PAGE = 8;

export async function getServerSideProps() {
  return fetchNFTs(1, NUM_PER_PAGE, null, "DESC")
    .then(({ data }) => {
      return {
        props: { nft: data?.list },
      };
    })
    .catch((err) => {
      // handle err
      console.log(err);
      return {
        props: { nft: [] },
      };
    });
}

export default function Home({ nft }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NFT[]>(nft);
  const [page, setPage] = useState(1);
  const [totalNFTs, setTotalNFTs] = useState(0);

  const canFetchMore = data.length !== totalNFTs;

  const handleFetchMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);

    setLoading(true);
    fetchNFTs(nextPage, NUM_PER_PAGE, null, "DESC")
      .then(({ data: fetchedData }) => {
        setData([...data, ...fetchedData.list]);
        setTotalNFTs(fetchedData.total);
      })
      .catch((err) => {
        // handle err
        console.log(err);
      });

    setLoading(false);
  };

  return (
    <>
      <HomePage
        data={data}
        loading={loading}
        hasMore={canFetchMore}
        onFetchMore={handleFetchMore}
      />
    </>
  );
}
