<?php
/**
 * achenacidade — Script PHP de Exportação de Lojas, Produtos e Dados para Arquivo SQL
 * Compatível com Hospedagem HostGator (cPanel / phpMyAdmin / MySQL 5.7+ / 8.0+)
 *
 * Este script conecta-se ao banco de dados MySQL via PDO e gera um arquivo .sql completo
 * contendo a estrutura (DDL) e todas as instruções INSERT prontas para download ou migração.
 */

require_once __DIR__ . '/config.php';

try {
    $db = getDbConnection();

    // Nome do arquivo gerado para download
    $filename = 'achenacidade_export_' . date('Y-m-d_H-i-s') . '.sql';

    // Configura cabeçalhos de resposta para forçar o download do arquivo .sql no navegador
    header('Content-Type: application/sql; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    $out = fopen('php://output', 'w');

    function writeSqlLine($handle, $text = '') {
        fwrite($handle, $text . "\n");
    }

    writeSqlLine($out, "-- ========================================================");
    writeSqlLine($out, "-- achenacidade — Exportação de Lojas, Produtos e Banners");
    writeSqlLine($out, "-- Gerado em: " . date('Y-m-d H:i:s'));
    writeSqlLine($out, "-- Servidor: HostGator MySQL / MariaDB");
    writeSqlLine($out, "-- ========================================================");
    writeSqlLine($out, "");
    writeSqlLine($out, "SET NAMES utf8mb4;");
    writeSqlLine($out, "SET FOREIGN_KEY_CHECKS = 0;");
    writeSqlLine($out, "");

    // Lista de tabelas a serem exportadas em ordem de integridade referencial
    $tables = ['cidades', 'categorias', 'planos', 'empresas', 'produtos', 'banners'];

    foreach ($tables as $table) {
        // Verifica se a tabela existe no banco de dados
        $checkStmt = $db->query("SHOW TABLES LIKE " . $db->quote($table));
        if ($checkStmt->rowCount() === 0) {
            continue;
        }

        writeSqlLine($out, "-- --------------------------------------------------------");
        writeSqlLine($out, "-- Estrutura e Registros da tabela `$table`");
        writeSqlLine($out, "-- --------------------------------------------------------");

        // Exporta a instrução CREATE TABLE
        $createStmt = $db->query("SHOW CREATE TABLE `$table`");
        $createRow = $createStmt->fetch(PDO::FETCH_NUM);
        if (isset($createRow[1])) {
            writeSqlLine($out, "DROP TABLE IF EXISTS `$table`;");
            writeSqlLine($out, $createRow[1] . ";");
            writeSqlLine($out, "");
        }

        // Exporta os dados (INSERTS)
        $dataStmt = $db->query("SELECT * FROM `$table`");
        $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows)) {
            writeSqlLine($out, "-- (Nenhum registro cadastrado em `$table`)");
            writeSqlLine($out, "");
            continue;
        }

        $columns = array_keys($rows[0]);
        $colNames = implode(", ", array_map(function($c) { return "`" . $c . "`"; }, $columns));

        foreach ($rows as $row) {
            $values = [];
            foreach ($row as $val) {
                if ($val === null) {
                    $values[] = "NULL";
                } else {
                    $values[] = $db->quote($val);
                }
            }
            $insertSql = "INSERT INTO `$table` ($colNames) VALUES (" . implode(", ", $values) . ");";
            writeSqlLine($out, $insertSql);
        }

        writeSqlLine($out, "");
    }

    writeSqlLine($out, "SET FOREIGN_KEY_CHECKS = 1;");
    writeSqlLine($out, "-- Fim da exportação SQL achenacidade");

    fclose($out);
    exit();

} catch (Exception $e) {
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao exportar dados SQL: ' . $e->getMessage()
    ]);
}
