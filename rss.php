<?php
header('Content-Type: application/rss+xml; charset=UTF-8');

// API'den deprem verilerini al
$api_url = 'https://api.orhanaydogdu.com.tr/deprem/kandilli/live';
$json_data = file_get_contents($api_url);
$data = json_decode($json_data);

// RSS başlangıç
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Türkiye Deprem Verileri</title>
        <link>https://depremverileri.com</link>
        <description>Türkiye'deki son depremler hakkında güncel bilgiler</description>
        <language>tr-TR</language>
        <lastBuildDate><?php echo date('r'); ?></lastBuildDate>
        <atom:link href="https://depremverileri.com/rss.xml" rel="self" type="application/rss+xml"/>
        <category>Deprem</category>
        <copyright>Copyright <?php echo date('Y'); ?>, Deprem Verileri</copyright>
        <docs>https://depremverileri.com/rss</docs>
        <generator>Deprem Verileri RSS Generator</generator>
        <ttl>5</ttl>

        <?php
        if ($data && $data->status && is_array($data->result)) {
            foreach ($data->result as $quake) {
                $date = new DateTime($quake->date);
                $pubDate = $date->format('r');
                $title = sprintf('%.1f Büyüklüğünde Deprem: %s', $quake->mag, $quake->title);
                $description = sprintf(
                    'Büyüklük: %.1f<br/>'.
                    'Yer: %s<br/>'.
                    'Tarih: %s<br/>'.
                    'Derinlik: %.1f km<br/>'.
                    'Koordinatlar: %.4f, %.4f',
                    $quake->mag,
                    $quake->title,
                    $date->format('d.m.Y H:i:s'),
                    $quake->depth,
                    $quake->geojson->coordinates[1],
                    $quake->geojson->coordinates[0]
                );
                
                echo "        <item>\n";
                echo "            <title>" . htmlspecialchars($title) . "</title>\n";
                echo "            <link>https://depremverileri.com/detay/" . urlencode($quake->date) . "</link>\n";
                echo "            <description>" . htmlspecialchars($description) . "</description>\n";
                echo "            <pubDate>" . $pubDate . "</pubDate>\n";
                echo "            <guid>https://depremverileri.com/deprem/" . urlencode($quake->date) . "</guid>\n";
                echo "            <category>Deprem</category>\n";
                echo "        </item>\n";
            }
        }
        ?>
    </channel>
</rss> 