const convertToArray = (str:string,splitter:string)=>{
    const arr = str
      .split(splitter)   // split dengan koma atau enter
      .map(item => item.trim()) // hilangkan spasi
      .filter(item => item.length > 0); // buang data kosong

    return arr;
}