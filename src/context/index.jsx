import React, { useContext, createContext } from "react";

import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite,
  useNetwork,
  ChainId,
  useNetworkMismatch,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { EditionMetadataWithOwnerOutputSchema } from "@thirdweb-dev/sdk";
import crowdabi from "../abi/crowd.abi.json";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract(
    "0xF5Af9b2eD533cA51B11244bbE816A0909367E11D",
    crowdabi
  );

  const isMismatched = useNetworkMismatch();
  const address = useAddress();
  const connect = useMetamask();
  const [, switchNetwork] = useNetwork();

  const publishCampaign = async (form) => {
    if (isMismatched) {
      await switchNetwork(ChainId.Mumbai);
      try {
        const data = await contract.call(
          "createCampaign",
          address,
          form.title,
          form.description,
          form.target,
          new Date(form.deadline).getTime(),
          form.image
        );
        console.log("contract call success", data);
      } catch (error) {
        console.log("contract call failure", error);
      }
    } else {
      try {
        const data = await contract.call(
          "createCampaign",
          address,
          form.title,
          form.description,
          form.target,
          new Date(form.deadline).getTime(),
          form.image
        );
        console.log("contract call success", data);
      } catch (error) {
        console.log("contract call failure", error);
      }
    }
  };

  const getCampaigns = async () => {
    const campaigns = await contract.call("getCampaigns");

    const parsedCampaings = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(
        campaign.amountCollected.toString()
      ),
      image: campaign.image,
      pId: i,
    }));

    return parsedCampaings;
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address
    );

    return filteredCampaigns;
  };

  const donate = async (pId, amount) => {
    const data = await contract.call("donateToCampaign", [pId], {
      value: ethers.utils.parseEther(amount),
    });

    return data;
  };

  const getDonations = async (pId) => {
    const donations = await contract.call("getDonators", [pId]);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString()),
      });
    }

    return parsedDonations;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
