import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatCpf } from "@/lib/validators/cpf";
import { formatDate, formatDurationSeconds, formatTime } from "@/lib/utils";
import { generateCertificateHash } from "@/lib/certificate/certificateHash";
import type { Treinamento } from "@/types/treinamento";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  title: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  paragraph: {
    lineHeight: 1.5,
    marginBottom: 16,
    textAlign: "justify",
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 6,
    marginTop: 14,
    borderBottom: "1 solid #cccccc",
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 170,
    fontFamily: "Helvetica-Bold",
    color: "#444444",
  },
  value: {
    flex: 1,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletDot: {
    width: 12,
  },
  bulletText: {
    flex: 1,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 28,
    paddingTop: 10,
    borderTop: "1 solid #cccccc",
    fontSize: 8.5,
    color: "#555555",
    lineHeight: 1.4,
  },
});

interface CertificateDocumentProps {
  training: Treinamento;
}

export function CertificateDocument({ training }: CertificateDocumentProps) {
  const companyName = process.env.COMPANY_NAME ?? "Fama Transporte Turismo Ltda";
  const trainingTitle = process.env.TRAINING_TITLE ?? "Treinamento de Motoristas";
  const verificationCode = generateCertificateHash(training);
  const generatedAt = new Date();

  return (
    <Document title={`Termo de Treinamento - ${training.nome}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.companyName}>{companyName}</Text>
        <Text style={styles.title}>Termo de Confirmação de Conclusão de Treinamento</Text>

        <Text style={styles.paragraph}>
          Este documento certifica, com base nos registros eletrônicos do sistema de
          treinamento de motoristas, que o motorista abaixo identificado assistiu
          integralmente ao vídeo de treinamento &quot;{trainingTitle}&quot; e confirmou sua
          conclusão por meio de ação eletrônica, cujos detalhes técnicos estão descritos
          neste termo.
        </Text>

        <Text style={styles.sectionTitle}>Dados do motorista</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nome completo</Text>
          <Text style={styles.value}>{training.nome}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Matrícula</Text>
          <Text style={styles.value}>{training.matricula}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>CPF</Text>
          <Text style={styles.value}>{formatCpf(training.cpf)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Dados do treinamento</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Treinamento</Text>
          <Text style={styles.value}>{trainingTitle}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>Concluído</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Início da sessão</Text>
          <Text style={styles.value}>
            {formatDate(training.started_at)} às {formatTime(training.started_at)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Confirmação de conclusão</Text>
          <Text style={styles.value}>
            {formatDate(training.created_at)} às {formatTime(training.created_at)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Duração assistida</Text>
          <Text style={styles.value}>
            {formatDurationSeconds(training.duracao_assistida)} de{" "}
            {formatDurationSeconds(training.duracao_video)} do vídeo
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Endereço IP</Text>
          <Text style={styles.value}>{training.ip ?? "não capturado"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sistema operacional</Text>
          <Text style={styles.value}>{training.sistema_operacional ?? "não identificado"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Navegador</Text>
          <Text style={styles.value}>{training.navegador ?? "não identificado"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Código único do registro</Text>
          <Text style={styles.value}>{training.id}</Text>
        </View>

        <Text style={styles.sectionTitle}>Controles técnicos aplicados</Text>
        <View style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            O vídeo não permite avanço ou salto de trecho durante a reprodução; qualquer
            tentativa de pular é revertida automaticamente pelo sistema.
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            A confirmação de conclusão só é disponibilizada ao motorista após o consumo
            integral do conteúdo do vídeo.
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            O tempo decorrido entre o início da sessão e a confirmação é validado pelo
            relógio do próprio servidor, tornando inviável confirmar a conclusão em tempo
            menor que a duração real do vídeo.
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            O CPF informado é validado (dígito verificador) e não pode ser reutilizado para
            confirmar este mesmo treinamento mais de uma vez.
          </Text>
        </View>

        <Text style={styles.footer}>
          Documento gerado automaticamente em {formatDate(generatedAt.toISOString())} às{" "}
          {formatTime(generatedAt.toISOString())} pelo sistema de treinamento de motoristas.
          {"\n"}
          Código de verificação: {verificationCode} — este código é derivado dos dados do
          registro e do sistema; qualquer alteração posterior dos dados invalida o código.
        </Text>
      </Page>
    </Document>
  );
}
