const { AuthenticationError } = require('apollo-server-express');
const { Matchup, Tech, User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const profileData = await User.findOne({ _id: context.user._id }).select("-__v -password").populate("savedBooks");

        return profileData;
    }
    throw new AuthenticationError("You must be logged in to view your saved books!")
  },

  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect login info, please try again!");
      }

      const correctPW = await user.isCorrectPassword(password);

      if (!correctPW) {
        throw new AuthenticationError("Incorrect login info, please try again!");
      }

      const token = signToken(user);
      return { token, user };
    },

    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user }
    },

    saveBook: async (parent, { bookData }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: { bookData } }},
          { new: true, runValidators: true  },
        );
        return updatedUser;
      }
      throw new AuthenticationError("You must be logged in to save a book!");
    },

    removeBook: async (parent, { bookID }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookID } }},
          { new: true, runValidators: true  },
        );
        return updatedUser;
      }
      throw new AuthenticationError("Please Login to proceed with request!");
    },
  },
},
};

module.exports = resolvers;
