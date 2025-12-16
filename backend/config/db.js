import mongoose from 'mongoose';

export const connect = (url) => {
  return mongoose.connect(url).then(res => {
    console.log('✅ DB connected.');
    return res;
  });
};
