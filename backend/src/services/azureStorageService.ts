import {BlobServiceClient} from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!
const containerName = 'consentimientos'


const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

export const subirArchivoAzure =  async(filePath:string, blobName:string)=>{
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(filePath);

    return blobName;
}