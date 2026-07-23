import { Button } from "../ui/button";

const trainingDataUrl = ""

export default function FileDownloader() {
    async function handleFileDownload() {
        try {
            //TODO service for api call to get training data
            const data = await fetch(trainingDataUrl).then(response => response.text());
            const blob = new Blob([data], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'example.txt'
            link.click()
            URL.revokeObjectURL(url)   
        } catch (error) {
            console.error("Error downloading file:", error);
        }

    }

    return (
        <div>
            <Button onClick={handleFileDownload}>Download training data</Button>
        </div>
    );
}