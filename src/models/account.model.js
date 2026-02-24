const mongoose = require("mongoose");
const ledgerModel = require("./ledger.model");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with a user"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        messages: "Status can be either ACTIVE, FROZEN or CLOSED",
      },
      default: "ACTIVE",
    },
    currency: {
      type: String,
      requried: [true, "Currency is requried for creating an account"],
      default: "INR",
    },
  },
  {
    timestamps: true,
  },
);

//Compond Index
accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function () {
  const ledgerEntries = await ledgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalCredits: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "CREDIT"] },
              then: "$amount",
              else: 0,
            },
          },
        },
        totalDebits: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "DEBIT"] },
              then: "$amount",
              else: 0,
            },
          },
        },
      },
    },
    {
      $project: {
        balance: { $subtract: ["$totalCredits", "$totalDebits"] }, // Ensure $subtract is used correctly
      },
    },
  ]);
  return ledgerEntries.length > 0 ? ledgerEntries[0].balance : 0;
};

const accountModel = mongoose.model("account", accountSchema);

module.exports = accountModel;
