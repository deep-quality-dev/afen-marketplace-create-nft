import Link from "next/link";
import React from "react";
import { NFT } from "../../types/NFT";
import { CardMedia, CardText, CardAvatar } from "../Card";
import Typography from "../IO/Typography";
import Flex from "../Layout/Flex";
import UserAvatar from "../User/UserAvatar";

interface ListingGridItemProps {
  item: NFT;
  width?: string;
  loading?: boolean;
  onClick: () => void;
}

export default function HomeListingGridItem({
  item,
  width,
  // loading,
  onClick,
}: ListingGridItemProps) {
  const getPrice = () => {
    let price = {
      currency: "AFEN",
      amount: item.afenPrice,
    };

    if (item.afenPrice === 0) {
      price = {
        currency: "BNB",
        amount: item.bnbPrice,
      };
    }

    return price;
  };

  return (
    <div
      className={`cursor-pointer bg-gray-500 border dark:border-gray-700 overflow-hidden rounded-xl ${
        width ? width : "w-auto"
      }`}
      onClick={onClick}
    >
      <CardMedia src={item.path} />
      <CardText>
        <Typography
          textWidth="w-full"
          truncate
          style="text-xl font-medium dark:text-gray-400"
        >
          {item.title}
        </Typography>
        {/* <Link href={`user/${item.user._id}`}> */}
        <Flex style="mb-3 mt-1">
          <UserAvatar image={item.creator?.avatar} name={item.creator?.name} />
          <Typography truncate textWidth="w-full" sub>
            {item.creator.name}
          </Typography>
        </Flex>
        {/* </Link> */}

        <Typography bold>
          {getPrice().amount || 0} {getPrice().currency}
        </Typography>
      </CardText>
    </div>
  );
}
