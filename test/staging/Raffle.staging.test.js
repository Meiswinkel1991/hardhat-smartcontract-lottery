const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle staging test", () => {
          let raffle, raffleEntranceFee, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
          })

          describe("fulfillRandomWords", () => {
              it("works with live Chainlink Keepers and Chainlink VRF, we gaet a random winner", async () => {
                  // Enter the raffle
                  const startingTimeStamp = await raffle.getLastTimeStamp()
                  const accounts = await ethers.getSigners()
                  raffleEntranceFee = await raffle.getEntranceFee()

                  await new Promise(async (resolve, reject) => {
                      // Set up listener before we enter the raffle
                      // Just in case the moves REALLY fast
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance =
                                  await accounts[0].getBalance()
                              const endingTimeStamp =
                                  await raffle.getLastTimeStamp()

                              await expect(raffle.getNumberOfPlayers(0)).to.be
                                  .reverted
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[0].address
                              )
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(raffleEntranceFee)
                                      .toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (err) {
                              console.log(err)
                              reject(e)
                          }
                      })

                      //Then entering the raffle
                      await raffle.enterRaffle({ value: raffleEntranceFee })

                      const winnerStartingBalance =
                          await accounts[0].getBalance()
                      // and this code WONT complet until our listener has finished listening!
                  })
              })
          })
      })
