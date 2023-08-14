# Use an official Node.js runtime as the base image
FROM node:12

# Set the working directory inside the container
WORKDIR /server

# Copy the rest of the application code
COPY server .

# Expose port 6054
EXPOSE 6054

# Start the Node.js server
CMD [ "node", "server.js" ]
