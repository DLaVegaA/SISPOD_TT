import {BlobClient, BlobSASPermissions, BlobServiceClient, generateBlobSASQueryParameters} from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!
const containerName = process.env.AZURE_STORAGE_CONTAINER!


const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

export const subirArchivoAzure =  async(filePath:string, blobName:string)=>{
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(filePath);

    return blobName;
}

export const generarSAS = async(blobName:string) =>{
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlobClient(blobName);

    const expiraEn = new Date();
    expiraEn.setMinutes(expiraEn.getMinutes()+10);
    console.log('El link expira en: ',expiraEn)
    const sasToken = generateBlobSASQueryParameters(
        {
            containerName,
            permissions:BlobSASPermissions.parse('r'),
            expiresOn:expiraEn,
            contentDisposition: 'inline',
            contentType: 'application/pdf'
        },
        blobServiceClient.credential as any
    ).toString();

    return `${blockBlobClient.url}?${sasToken}`;
}

export const EliminarArchivo = async(blobName:string) =>{
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient =containerClient.getBlobClient(blobName);

    await blockBlobClient.deleteIfExists()
}